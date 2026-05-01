import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, CheckCircle, XCircle, Clock, Loader2, AlertCircle, PlayCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getScans,
  getConnections,
  getBenchmarks,
  createScan,
  deleteScan,
  getSettings,
  getScanReadiness,
  type ScanReadinessResponse,
} from '../../api/client';
import { formatDateTimePartsAEST } from '../../utils/helpers';
import './ScansPage.css';

type ScansPageProps = {
  sidebarWidth?: number;
  isDarkMode?: boolean;
}

type Scan = {
  id: number | string;
  status?: string;
  benchmark?: string;
  version?: string;
  connection_name?: string;
  m365_connection_id?: number | string;
  started_at?: string | null;
  created_at?: string | null;
  passed_count?: number;
  failed_count?: number;
  error_count?: number;
  total_controls?: number;
}

type Connection = {
  id: number | string;
  name: string;
}

type Benchmark = {
  framework: string;
  slug: string;
  version: string;
  name: string;
}

type NewScanFormData = {
  m365_connection_id: string;
  benchmark_key: string;
}

type LocationState = {
  openNewScan?: boolean;
  preselect?: {
    m365_connection_id?: number | string;
    benchmark_key?: string;
  };
}

const ScansPage: React.FC<ScansPageProps> = ({ sidebarWidth = 220, isDarkMode = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  const [scans, setScans] = useState<Scan[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [confirmDeleteEnabled, setConfirmDeleteEnabled] = useState<boolean>(true);

  const navState = (location.state as LocationState | null) ?? null;

  const [showForm, setShowForm] = useState<boolean>(!!navState?.openNewScan);
  const [formData, setFormData] = useState<NewScanFormData>({
    m365_connection_id: navState?.preselect?.m365_connection_id ? String(navState.preselect.m365_connection_id) : '',
    benchmark_key: navState?.preselect?.benchmark_key || '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState<boolean>(false);
  const [readiness, setReadiness] = useState<ScanReadinessResponse | null>(null);
  const appliedNavStateRef = useRef<boolean>(false);

  const loadScans = useCallback(async (): Promise<void> => {
    try {
      const scansData = await getScans(token);
      setScans(scansData);
    } catch (err: unknown) {
      console.error('Failed to refresh scans:', err);
    }
  }, [token]);

  useEffect(() => {
    async function loadData(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const [scansData, connectionsData, benchmarksData] = await Promise.all([
          getScans(token),
          getConnections(token),
          getBenchmarks(token),
        ]);
        setScans(scansData);
        setConnections(connectionsData);
        setBenchmarks(benchmarksData);
      } catch (err: unknown) {
        setError((err as any)?.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [token]);

  // Allow Dashboard (or other pages) to deep-link into "/scans" with the "New Scan" form opened + preselected.
  useEffect(() => {
    if (appliedNavStateRef.current) {
      return;
    }
    const nav = (location.state as LocationState | null) ?? null;
    if (!nav?.openNewScan) {
      return;
    }
    appliedNavStateRef.current = true;
    setShowForm(true);
    setFormData(prev => ({
      ...prev,
      m365_connection_id: nav?.preselect?.m365_connection_id ? String(nav.preselect.m365_connection_id) : prev.m365_connection_id,
      benchmark_key: nav?.preselect?.benchmark_key || prev.benchmark_key,
    }));
  }, [location]);

  useEffect(() => {
    async function loadSettings(): Promise<void> {
      try {
        const settings = await getSettings(token);
        setConfirmDeleteEnabled(settings?.confirm_delete_enabled ?? true);
      } catch {
        // Fail-safe: default to showing confirmations.
        setConfirmDeleteEnabled(true);
      }
    }

    loadSettings();
  }, [token]);

  // Poll for scan updates every 5 seconds
  useEffect(() => {
    const hasPendingScans = scans.some(
      scan => scan.status === 'pending' || scan.status === 'running'
    );

    if (!hasPendingScans) return;

    const interval = setInterval(loadScans, 5000);
    return () => clearInterval(interval);
  }, [scans, loadScans]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>): void {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  useEffect(() => {
    // Any change to connection or benchmark invalidates the previous readiness result.
    setReadiness(null);
  }, [formData.m365_connection_id, formData.benchmark_key]);

  function parseSelectedBenchmark(): { framework: string; benchmark: string; version: string } | null {
    const parts = formData.benchmark_key.split('|');
    if (parts.length !== 3) return null;
    const [framework, benchmark, version] = parts;
    if (!framework || !benchmark || !version) return null;
    return { framework, benchmark, version };
  }

  // Get a warning message if the pre-scan readiness checks did not pass.
  function getReadinessWarningMessage(): string | null {
    if (!readiness) {
      return 'Pre-scan readiness has not been run. Starting anyway may lead to a stuck, pending, or partially failed scan if the tenant is missing required permissions. Do you want to continue?';
    }

    const hasFailures = readiness.checks.some(check => check.status === 'fail');
    if (hasFailures) {
      return 'Pre-scan readiness found blocking issues. Starting anyway may lead to a stuck, pending, or failed scan because some required access checks did not pass. Do you want to continue?';
    }

    const hasWarnings = readiness.checks.some(check => check.status === 'warn');
    if (hasWarnings) {
      return 'Pre-scan readiness returned warnings. Some controls may be skipped or fail during the scan. Do you want to continue?';
    }

    return null;
  }

  async function handleRunReadinessCheck(): Promise<void> {
    setError(null);
    setReadiness(null);

    if (!formData.m365_connection_id) {
      setError('Select a cloud platform before running readiness checks.');
      return;
    }

    const parsedBenchmark = parseSelectedBenchmark();
    if (!parsedBenchmark) {
      setError('Select a benchmark before running readiness checks.');
      return;
    }

    setIsCheckingReadiness(true);
    try {
      const readinessResult = await getScanReadiness(token, {
        m365_connection_id: parseInt(formData.m365_connection_id, 10),
        framework: parsedBenchmark.framework,
        benchmark: parsedBenchmark.benchmark,
        version: parsedBenchmark.version,
      });
      setReadiness(readinessResult);
      if (!readinessResult.ready) {
        setError('Environment is not ready. Resolve the critical checks shown below.');
      }
    } catch (err: unknown) {
      setError((err as any)?.message || 'Failed to run readiness checks');
    } finally {
      setIsCheckingReadiness(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);

    const readinessWarning = getReadinessWarningMessage();
    if (readinessWarning && !window.confirm(readinessWarning)) {
      return;
    }

    const parsedBenchmark = parseSelectedBenchmark();
    if (!parsedBenchmark) {
      setError('Invalid benchmark selection. Please select a benchmark again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newScan = await createScan(token, {
        m365_connection_id: parseInt(formData.m365_connection_id, 10),
        framework: parsedBenchmark.framework,
        benchmark: parsedBenchmark.benchmark,
        version: parsedBenchmark.version,
      });

      setScans(prev => [newScan, ...prev]);
      setFormData({ m365_connection_id: '', benchmark_key: '' });
      setReadiness(null);
      setShowForm(false);
    } catch (err: unknown) {
      setError((err as any)?.message || 'Failed to create scan');
    } finally {
      setIsSubmitting(false);
    }
  }

  function getStatusIcon(status?: string): React.ReactNode {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="status-icon success" />;
      case 'failed':
        return <XCircle size={16} className="status-icon error" />;
      case 'running':
        return <Loader2 size={16} className="status-icon running spinning" />;
      default:
        return <Clock size={16} className="status-icon pending" />;
    }
  }

  function getStatusText(status?: string): string {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'running':
        return 'Running';
      default:
        return 'Pending';
    }
  }

  function formatDate(dateString?: string | null): ReturnType<typeof formatDateTimePartsAEST> {
    return formatDateTimePartsAEST(dateString);
  }

  async function handleDelete(scanId: number | string): Promise<void> {
    if (confirmDeleteEnabled) {
      const ok = window.confirm(
        'Are you sure you want to delete this scan? This action cannot be undone.'
      );
      if (!ok) return;
    }

    setDeletingId(scanId);
    setError(null);
    try {
      await deleteScan(token, scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
    } catch (err: unknown) {
      setError((err as any)?.message || 'Failed to delete scan');
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div
        className={`scans-page ${isDarkMode ? 'dark' : 'light'}`}
        style={{
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: 'margin-left 0.4s ease, width 0.4s ease'
        }}
      >
        <div className="scans-container">
          <div className="loading-state">
            <Loader2 size={32} className="spinning" />
            <p>Loading scans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`scans-page ${isDarkMode ? 'dark' : 'light'}`}
      style={{
        marginLeft: `${sidebarWidth}px`,
        width: `calc(100% - ${sidebarWidth}px)`,
        transition: 'margin-left 0.4s ease, width 0.4s ease'
      }}
    >
      <div className="scans-container">
        <div className="page-header">
          <div className="header-content">
            <Search size={24} />
            <div className="header-text">
              <h1>Compliance Scans</h1>
              <p>Run and manage compliance scans against your M365 connections</p>
            </div>
          </div>
          <button
            className="toolbar-button primary"
            onClick={() => setShowForm(!showForm)}
            disabled={connections.length === 0}
          >
            <Plus size={16} />
            <span>New Scan</span>
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {connections.length === 0 && !isLoading && (
          <div className="warning-banner">
            <AlertCircle size={18} />
            <span>You need to add a connection before you can run scans.</span>
          </div>
        )}

        {showForm && (
          <div className="scan-form-card">
            <h3>New Compliance Scan</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="m365_connection_id">Cloud Platform</label>
                  <select
                    id="m365_connection_id"
                    name="m365_connection_id"
                    value={formData.m365_connection_id}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select a cloud platform</option>
                    {connections.map(conn => (
                      <option key={conn.id} value={conn.id}>
                        {conn.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="benchmark_key">Benchmark</label>
                  <select
                    id="benchmark_key"
                    name="benchmark_key"
                    value={formData.benchmark_key}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select a benchmark</option>
                    {benchmarks.map(bench => (
                      <option
                        key={`${bench.framework}|${bench.slug}|${bench.version}`}
                        value={`${bench.framework}|${bench.slug}|${bench.version}`}
                      >
                        {bench.name} ({bench.version})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="readiness-controls">
                <button
                  type="button"
                  className="toolbar-button secondary"
                  onClick={handleRunReadinessCheck}
                  disabled={
                    isSubmitting ||
                    isCheckingReadiness ||
                    !formData.m365_connection_id ||
                    !formData.benchmark_key
                  }
                >
                  {isCheckingReadiness ? (
                    <>
                      <Loader2 size={16} className="spinning" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <span>Run Readiness Check</span>
                  )}
                </button>
                {readiness ? (
                  <span className={`readiness-state ${readiness.ready ? 'ready' : 'not-ready'}`}>
                    {readiness.ready ? 'Ready' : 'Not Ready'}
                  </span>
                ) : null}
              </div>

              {readiness ? (
                <div className={`readiness-card ${readiness.ready ? 'ready' : 'not-ready'}`}>
                  <h4>Pre-scan readiness</h4>
                  <p>{readiness.summary}</p>
                  <ul className="readiness-check-list">
                    {readiness.checks.map(check => (
                      <li key={check.key} className={`readiness-check ${check.status}`}>
                        <div className="readiness-check-main">
                          <span className="readiness-check-label">{check.label}</span>
                          <span className={`readiness-pill ${check.status}`}>
                            {check.status.toUpperCase()}
                          </span>
                        </div>
                        <span className="readiness-check-message">{check.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="warning-banner readiness-hint">
                  <AlertCircle size={18} />
                  <span>Run readiness check before starting a scan.</span>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="toolbar-button secondary"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="toolbar-button primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spinning" />
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle size={16} />
                      <span>Start Scan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="scans-list">
          {scans.length === 0 ? (
            <div className="empty-state">
              <Search size={48} />
              <h3>No scans yet</h3>
              <p>Run your first compliance scan to see results here.</p>
            </div>
          ) : (
            <table className="scans-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Benchmark</th>
                  <th>Connection</th>
                  <th>Started</th>
                  <th>Results</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scans.map(scan => (
                  <tr
                    key={scan.id}
                    onClick={() => navigate(`/scans/${scan.id}`)}
                    className="scan-row"
                  >
                    <td>
                      <span className={`status-badge ${scan.status || 'pending'}`}>
                        {getStatusIcon(scan.status)}
                        {getStatusText(scan.status)}
                      </span>
                    </td>
                    <td>
                      <span className="benchmark-name">
                        {scan.benchmark || '-'}
                      </span>
                      <span className="benchmark-version">{scan.version || ''}</span>
                    </td>
                    <td>{scan.connection_name || (scan.m365_connection_id ? `Connection #${scan.m365_connection_id}` : '-')}</td>
                    <td>
                      {(() => {
                        const dateString = scan.started_at || scan.created_at;
                        if (!dateString) return '-';
                        const dt = formatDate(dateString);
                        return (
                          <div className="datetime">
                            <div className="date">{dt.date}</div>
                            <div className="time">{dt.time}</div>
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      {scan.status === 'completed' || scan.status === 'running' ? (
                        <div className="results-summary">
                          <span className="passed">{scan.passed_count || 0} passed</span>
                          <span className="failed">{scan.failed_count || 0} failed</span>
                          {scan.status === 'running' && (scan.total_controls || 0) > 0 && (
                            <span className="progress">
                              ({(scan.passed_count || 0) + (scan.failed_count || 0) + (scan.error_count || 0)}/{scan.total_controls || 0})
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="actions-cell" onClick={(e: React.MouseEvent<HTMLTableCellElement>) => e.stopPropagation()}>
                      <button
                        className="toolbar-button danger"
                        onClick={() => handleDelete(scan.id)}
                        disabled={deletingId === scan.id}
                      >
                        {deletingId === scan.id ? (
                          <Loader2 size={14} className="spinning" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        <span>{deletingId === scan.id ? 'Deleting...' : 'Delete'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScansPage;
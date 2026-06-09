using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace wrapper
{
    public partial class Form1 : Form
    {
        private Process? _nodeProcess;
        private WebView2? _webView;
        private string _tempExePath = string.Empty;
        private const string TargetUrl = "http://localhost:3000/index.html";
        private bool _isClosing = false;
        private Label? _lblLoading;
        private int _consecutiveRestarts = 0;
        private NotifyIcon? _notifyIcon;
        private bool _allowExit = false;
        private bool _shownBalloon = false;

        // P/Invoke untuk memanggil API Windows DWM guna mengubah warna title bar
        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

        private const int DWMWA_USE_IMMERSIVE_DARK_MODE = 20;
        private const int DWMWA_USE_IMMERSIVE_DARK_MODE_BEFORE_20H1 = 19;

        private void UseImmersiveDarkMode(IntPtr handle, bool enabled)
        {
            int useDarkMode = enabled ? 1 : 0;
            DwmSetWindowAttribute(handle, DWMWA_USE_IMMERSIVE_DARK_MODE, ref useDarkMode, sizeof(int));
            DwmSetWindowAttribute(handle, DWMWA_USE_IMMERSIVE_DARK_MODE_BEFORE_20H1, ref useDarkMode, sizeof(int));
        }

        public Form1()
        {
            UseImmersiveDarkMode(this.Handle, true);

            this.Text = "Soloptik Dashboard";
            this.Width = 1280;
            this.Height = 720;
            this.MinimumSize = new System.Drawing.Size(1100, 680);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = System.Drawing.Color.FromArgb(18, 18, 18);

            // Bunuh sisa proses dari sesi sebelumnya
            KillAllBackendProcesses();

            ExtractBackend();

            _lblLoading = new Label()
            {
                Text = "Memulai Server Soloptik...\nMohon tunggu sebentar.",
                Dock = DockStyle.Fill,
                TextAlign = System.Drawing.ContentAlignment.MiddleCenter,
                ForeColor = System.Drawing.Color.White,
                Font = new System.Drawing.Font("Segoe UI Semibold", 14F, System.Drawing.FontStyle.Regular)
            };
            this.Controls.Add(_lblLoading);

            Task.Run(async () =>
            {
                StartNodeServer();
                bool serverReady = await WaitForServerAsync();

                if (serverReady)
                {
                    this.Invoke((System.Windows.Forms.MethodInvoker)delegate
                    {
                        if (_lblLoading != null)
                        {
                            this.Controls.Remove(_lblLoading);
                            _lblLoading.Dispose();
                            _lblLoading = null;
                        }
                        InitializeBrowser();
                    });
                }
                else
                {
                    this.Invoke((System.Windows.Forms.MethodInvoker)delegate
                    {
                        MessageBox.Show("Gagal terhubung dengan server backend.", "Koneksi Gagal", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    });
                }
            });

            InitializeTrayIcon();
            this.FormClosing += Form1_FormClosing;
        }

        private void ExtractBackend()
        {
            try
            {
                _tempExePath = Path.Combine(Path.GetTempPath(), "soloptik_backend.exe");

                if (File.Exists(_tempExePath))
                {
                    try { File.Delete(_tempExePath); }
                    catch
                    {
                        _tempExePath = Path.Combine(Path.GetTempPath(), $"soloptik_backend_{Guid.NewGuid().ToString().Substring(0, 8)}.exe");
                    }
                }

                var assembly = Assembly.GetExecutingAssembly();
                string resourceName = "wrapper.soloptik.exe";

                using (Stream? stream = assembly.GetManifestResourceStream(resourceName))
                {
                    if (stream == null)
                        throw new Exception($"Resource '{resourceName}' tidak ditemukan.");

                    using (FileStream fileStream = new FileStream(_tempExePath, FileMode.Create, FileAccess.Write))
                    {
                        stream.CopyTo(fileStream);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal mempersiapkan server backend:\n" + ex.Message, "Error Inisialisasi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void StartNodeServer()
        {
            if (string.IsNullOrEmpty(_tempExePath) || !File.Exists(_tempExePath)) return;

            KillAllBackendProcesses();

            try
            {
                _nodeProcess = new Process();
                _nodeProcess.StartInfo.FileName = _tempExePath;
                _nodeProcess.StartInfo.WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory;
                _nodeProcess.StartInfo.CreateNoWindow = true;
                _nodeProcess.StartInfo.UseShellExecute = false;
                _nodeProcess.EnableRaisingEvents = true;
                _nodeProcess.Exited += NodeProcess_Exited;
                _nodeProcess.Start();
            }
            catch (Exception ex)
            {
                this.Invoke((System.Windows.Forms.MethodInvoker)delegate
                {
                    MessageBox.Show("Gagal memulai server backend:\n" + ex.Message, "Error Server", MessageBoxButtons.OK, MessageBoxIcon.Error);
                });
            }
        }

        /// <summary>
        /// Matikan SEMUA proses soloptik_backend yang sedang berjalan (zombie prevention).
        /// </summary>
        private void KillAllBackendProcesses()
        {
            // Bunuh proses apa pun yang menduduki port 3000
            KillProcessOnPort(3000);

            // Bunuh berdasarkan nama file temp yang diketahui
            if (!string.IsNullOrEmpty(_tempExePath))
            {
                string procName = Path.GetFileNameWithoutExtension(_tempExePath);
                foreach (var proc in Process.GetProcessesByName(procName))
                {
                    try { proc.Kill(true); proc.WaitForExit(2000); } catch { }
                }
            }

            // Sweep lebih luas: bunuh semua soloptik_backend* di sistem
            foreach (var proc in Process.GetProcesses())
            {
                try
                {
                    if (proc.ProcessName.StartsWith("soloptik_backend", StringComparison.OrdinalIgnoreCase))
                    {
                        proc.Kill(true);
                        proc.WaitForExit(2000);
                    }
                }
                catch { }
            }
        }

        /// <summary>
        /// Mematikan proses apa pun yang menduduki port TCP tertentu (misalnya port 3000).
        /// </summary>
        private void KillProcessOnPort(int port)
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c netstat -ano | findstr :{port}",
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true
                };

                using (var proc = Process.Start(startInfo))
                {
                    if (proc != null)
                    {
                        string output = proc.StandardOutput.ReadToEnd();
                        proc.WaitForExit();

                        // Parse output untuk mendapatkan PID
                        var lines = output.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
                        foreach (var line in lines)
                        {
                            var parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                            if (parts.Length > 4)
                            {
                                string pidStr = parts[parts.Length - 1];
                                if (int.TryParse(pidStr, out int pid) && pid > 0)
                                {
                                    // Pastikan kita tidak membunuh diri sendiri
                                    if (pid != Process.GetCurrentProcess().Id)
                                    {
                                        try
                                        {
                                            var targetProc = Process.GetProcessById(pid);
                                            targetProc.Kill(true);
                                            targetProc.WaitForExit(2000);
                                        }
                                        catch { }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch { }
        }

        private async void NodeProcess_Exited(object? sender, EventArgs e)
        {
            if (_isClosing) return;

            _consecutiveRestarts++;
            if (_consecutiveRestarts > 3)
            {
                this.Invoke((System.Windows.Forms.MethodInvoker)delegate
                {
                    MessageBox.Show("Server backend crash berulang kali. Aplikasi akan ditutup.", "Error Fatal", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    ForceKillAndExit();
                });
                return;
            }

            this.Invoke((System.Windows.Forms.MethodInvoker)delegate
            {
                if (_webView != null) _webView.Visible = false;

                _lblLoading = new Label()
                {
                    Text = "Server terputus!\nSedang memulihkan koneksi...",
                    Dock = DockStyle.Fill,
                    TextAlign = System.Drawing.ContentAlignment.MiddleCenter,
                    ForeColor = System.Drawing.Color.Orange,
                    Font = new System.Drawing.Font("Segoe UI Semibold", 14F, System.Drawing.FontStyle.Regular)
                };
                this.Controls.Add(_lblLoading);
            });

            StartNodeServer();
            bool ok = await WaitForServerAsync();

            if (ok)
            {
                _consecutiveRestarts = 0;
                this.Invoke((System.Windows.Forms.MethodInvoker)delegate
                {
                    if (_lblLoading != null)
                    {
                        this.Controls.Remove(_lblLoading);
                        _lblLoading.Dispose();
                        _lblLoading = null;
                    }
                    if (_webView != null)
                    {
                        _webView.Visible = true;
                        _webView.CoreWebView2?.Reload();
                    }
                });
            }
        }

        private async Task<bool> WaitForServerAsync()
        {
            using (var client = new HttpClient())
            {
                client.Timeout = TimeSpan.FromSeconds(2);
                for (int i = 0; i < 15; i++)
                {
                    if (_isClosing) return false;
                    try
                    {
                        var response = await client.GetAsync(TargetUrl);
                        if (response.IsSuccessStatusCode) return true;
                    }
                    catch
                    {
                        await Task.Delay(1000);
                    }
                }
            }
            return false;
        }

        private async void InitializeBrowser()
        {
            // Folder data WebView2 unik per sesi agar bersih dan hemat RAM
            string userDataFolder = Path.Combine(Path.GetTempPath(), "SoloptikWebView2");

            var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder, new CoreWebView2EnvironmentOptions
            {
                // Matikan fitur yang makan RAM: GPU acceleration, crash reporting, dsb
                AdditionalBrowserArguments =
                    "--disable-gpu " +
                    "--disable-gpu-compositing " +
                    "--disable-software-rasterizer " +
                    "--js-flags=--max-old-space-size=128 " +
                    "--disable-extensions " +
                    "--disable-background-networking " +
                    "--disable-sync " +
                    "--metrics-recording-only " +
                    "--no-first-run " +
                    "--disable-crash-reporter"
            });

            _webView = new WebView2 { Dock = DockStyle.Fill };
            this.Controls.Add(_webView);

            try
            {
                await _webView.EnsureCoreWebView2Async(env);

                // Matikan fitur yang tidak digunakan untuk hemat RAM
                _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                _webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
                _webView.CoreWebView2.Settings.IsPasswordAutosaveEnabled = false;
                _webView.CoreWebView2.Settings.IsGeneralAutofillEnabled = false;

                _webView.CoreWebView2.NewWindowRequested += CoreWebView2_NewWindowRequested;
                _webView.Source = new Uri(TargetUrl);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal memuat komponen browser:\n" + ex.Message, "Error Browser", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void CoreWebView2_NewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
        {
            e.Handled = true;

            Form popupForm = new Form();
            UseImmersiveDarkMode(popupForm.Handle, true);

            popupForm.Text = "Soloptik - Control Dock";
            popupForm.Width = 480;
            popupForm.Height = 850;
            popupForm.StartPosition = FormStartPosition.CenterScreen;
            popupForm.BackColor = System.Drawing.Color.FromArgb(18, 18, 18);

            WebView2 popupWebView = new WebView2 { Dock = DockStyle.Fill };
            popupForm.Controls.Add(popupWebView);

            popupForm.Load += async (s, ev) =>
            {
                try
                {
                    await popupWebView.EnsureCoreWebView2Async(null);
                    popupWebView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                    popupWebView.CoreWebView2.Settings.AreDevToolsEnabled = false;
                    popupWebView.Source = new Uri(e.Uri);
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Gagal memuat halaman: " + ex.Message);
                }
            };

            popupForm.Show();
        }

        private void InitializeTrayIcon()
        {
            _notifyIcon = new NotifyIcon();
            _notifyIcon.Icon = this.Icon ?? System.Drawing.SystemIcons.Application;
            _notifyIcon.Text = "Soloptik Dashboard";
            _notifyIcon.Visible = true;

            _notifyIcon.DoubleClick += (s, e) =>
            {
                this.Show();
                this.WindowState = FormWindowState.Normal;
                this.Activate();
            };

            ContextMenuStrip contextMenu = new ContextMenuStrip();

            ToolStripMenuItem openItem = new ToolStripMenuItem("Buka Dashboard");
            openItem.Click += (s, e) =>
            {
                this.Show();
                this.WindowState = FormWindowState.Normal;
                this.Activate();
            };
            contextMenu.Items.Add(openItem);

            ToolStripMenuItem exitItem = new ToolStripMenuItem("Keluar");
            exitItem.Click += (s, e) =>
            {
                _allowExit = true;
                ForceKillAndExit();
            };
            contextMenu.Items.Add(exitItem);

            _notifyIcon.ContextMenuStrip = contextMenu;
        }

        private void Form1_FormClosing(object? sender, FormClosingEventArgs e)
        {
            if (!_allowExit)
            {
                e.Cancel = true;
                this.Hide();
                if (!_shownBalloon)
                {
                    _notifyIcon?.ShowBalloonTip(3000, "Soloptik", "Dashboard berjalan di System Tray. Klik kanan untuk membuka atau keluar.", ToolTipIcon.Info);
                    _shownBalloon = true;
                }
            }
            else
            {
                ForceKillAndExit();
            }
        }

        /// <summary>
        /// Mematikan SEMUA proses secara paksa — tidak ada zombie yang tersisa.
        /// </summary>
        private void ForceKillAndExit()
        {
            _isClosing = true;

            // Bersihkan icon tray
            try { _notifyIcon?.Dispose(); } catch { }

            // 1. Dispose WebView2 → membebaskan RAM dan mematikan proses renderer WebView2
            try { _webView?.Dispose(); } catch { }

            // 2. Bunuh proses Node backend beserta seluruh tree-nya
            try
            {
                if (_nodeProcess != null && !_nodeProcess.HasExited)
                    _nodeProcess.Kill(true); // true = bunuh seluruh process tree
            }
            catch { }
            try { _nodeProcess?.Dispose(); } catch { }

            // 3. Sweep luas — bunuh SEMUA sisa soloptik_backend di sistem
            KillAllBackendProcesses();

            // 4. Hapus file temp backend
            try { if (File.Exists(_tempExePath)) File.Delete(_tempExePath); } catch { }

            // 5. Matikan seluruh proses aplikasi ini secara paksa — tidak ada yang tersisa di RAM
            Environment.Exit(0);
        }
    }
}

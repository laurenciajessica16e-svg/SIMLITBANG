const [nip, setNip] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [errorMsg, setErrorMsg] = useState('');
const [showRegister, setShowRegister] = useState(false);

if (showRegister) {
  return <Register onBackToLogin={() => setShowRegister(false)} />;
}

const handleLogin = async () => {
    if (!nip.trim() || !password.trim()) {
        setErrorMsg('NIP dan password wajib diisi');
        return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nip: nip.trim(), password })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            setErrorMsg(data.message || 'Login gagal. Periksa kembali NIP dan password.');
            return;
        }

        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "admin") {
            navigate("/admin");
        } else {
            navigate("/dashboard");
        }

    } catch (err) {
        console.error('Login error:', err);
        setErrorMsg('Tidak bisa terhubung ke server. Coba lagi.');
    } finally {
        setLoading(false);
    }
};
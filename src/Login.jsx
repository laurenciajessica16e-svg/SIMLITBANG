const handleLogin = async () => {
    const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nip,
                password
            })
        }
    );

    const data = await response.json();

    if(data.success){
        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        if(data.user.role === "admin"){
            navigate("/admin");
        }else{
            navigate("/dashboard");
        }
    }
};
const API_BASE_URL =
  "http://127.0.0.1:8000/api";

export async function login(
  email,
  password
) {
  const response = await fetch(
    `${API_BASE_URL}/auth/login/`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const text =
    await response.text();

  console.log(text);

  return JSON.parse(text);
}
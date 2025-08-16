export async function createTask(taskData) {
  try {
    const response = await fetch("https://td-webapp.onrender.com/add_task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });

    return await response.json();
  } catch (err) {
    console.error("Ошибка при создании задачи:", err);
    return { error: err.message };
  }
}
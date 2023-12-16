const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("server running on  http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityandStatus = (reqQuery) => {
  return reqQuery.priority !== undefined && reqQuery.status !== undefined;
};

const hasPriority = (reqQuery) => {
  return reqQuery.priority !== undefined;
};
const hasStatus = (reqQuery) => {
  return reqQuery.status !== undefined;
};

app.get("/todos", async (req, res) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = req.query;

  switch (true) {
    case hasPriorityandStatus(req.query):
      getTodosQuery = `
            SELECT * FROM todo 
            WHERE todo 
            LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';
            `;
      break;

    case hasPriority(req.query):
      getTodosQuery = `
            SELECT * FROM todo 
            WHERE todo 
            LIKE '%${search_q}%'
            AND priority = '${priority}';
            `;
      break;

    case hasStatus(req.query):
      getTodosQuery = `
            SELECT * FROM todo 
            WHERE todo 
            LIKE '%${search_q}%'
            AND status = '${status}';
            `;
      break;

    default:
      getTodosQuery = `
            SELECT * FROM todo 
            WHERE todo 
            LIKE '%${search_q}%';
            `;
  }
  data = await database.all(getTodosQuery);
  res.send(data);
});

app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const getTodoQuery = `
    SELECT * FROM todo
    WHERE id = ${todoId};
    `;
  const todo = await database.get(getTodoQuery);
  res.send(todo);
});

app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status } = req.body;
  const postTodoQuery = `
    INSERT INTO todo(id,todo,priority,status)
    VALUES(${id},'${todo}','${priority}','${status}');`;

  await database.run(postTodoQuery);
  res.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
        SELECT *
        FROM
        todo
        WHERE
        id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `UPDATE todo SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
    WHERE id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
    todo
    WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;

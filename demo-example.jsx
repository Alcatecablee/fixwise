import React from 'react';
function TodoList({
  todos
}) {
  const count = 0;
  return <div>
      {todos.map(todo => <div key={todo.id || todo}>
          <span key={todo.id || todo}>{todo.text}</span>
          <Button onClick={() => {
        // [NeuroLint] Removed console.log: 'Deleting', todo.id
        ;
      }} key={todo.id || todo} aria-label="Button" variant="default">
            Delete
          </Button>
        </div>)}
    </div>;
}
export default TodoList;
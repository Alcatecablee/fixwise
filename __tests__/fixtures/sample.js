console.log("This should be removed by layer 2");

function Component() {
  const items = [1, 2, 3];
  return items.map(item => <div>{item}</div>);
}

if (typeof window !== 'undefined') {
  const width = window.innerWidth;
}

export default Component;

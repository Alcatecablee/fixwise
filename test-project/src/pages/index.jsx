import BadComponent from '../components/BadComponent';

export default function Home() {
  const items = [
    { name: 'Item 1', title: 'Title 1' },
    { name: 'Item 2', title: 'Title 2' },
    { name: 'Item 3', title: 'Title 3' }
  ];
  
  // Missing window check for hydration
  const width = window.innerWidth;
  
  console.log('Home page loaded');
  
  return (
    <div>
      <h1>Home Page</h1>
      <BadComponent items={items} />
      <p>Window width: {width}</p>
    </div>
  );
}

import './App.css';
import useStoreFoods from './store';
import { useShallow } from 'zustand/react/shallow';

function App() {
  const [foods, increasePopulation] = useStoreFoods(
    useShallow((store: any) => [store.foods, store.increasePopulation])
  );

  function increaseFood() {
    increasePopulation();
  }

  return (
    <div className="App">
      <h1>Start Kit</h1>
      <h1>{foods} around here...</h1>
      <button onClick={increaseFood}>one up</button>
    </div>
  );
}

export default App;
function shallow(a: any, b: any): boolean {
  throw new Error('Function not implemented.');
}

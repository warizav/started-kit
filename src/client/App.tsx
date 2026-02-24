import './App.css';
import useStoreFoods from './store';
import { useShallow } from 'zustand/react/shallow';
import { CeloDashboard } from './CeloDashboard';

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
      <CeloDashboard />
    </div>
  );
}

export default App;

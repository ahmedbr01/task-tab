import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartCard = ({ title, type, data, options, height = 280 }) => {
  const chartComponents = {
    line: Line,
    bar: Bar,
    pie: Pie,
    doughnut: Doughnut,
  };

  const ChartComponent = chartComponents[type] || Bar;

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-5">
      {title && (
        <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text mb-4 text-right">
          {title}
        </h3>
      )}
      <div style={{ height: height }}>
        <ChartComponent data={data} options={options} />
      </div>
    </div>
  );
};

export default ChartCard;
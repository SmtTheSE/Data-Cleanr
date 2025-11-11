import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Visualization = ({ rawData, cleanedData }) => {
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState({});
  const [error, setError] = useState('');

  // Use cleaned data if available, otherwise use raw data
  const data = cleanedData || rawData;

  // Get numeric and categorical columns
  const getColumns = () => {
    if (!data || data.length === 0) return { numeric: [], categorical: [] };
    
    const firstRow = data[0];
    const numericColumns = [];
    const categoricalColumns = [];
    
    Object.keys(firstRow).forEach(column => {
      // Check if column is numeric
      const isNumeric = data.some(row => {
        const value = row[column];
        return typeof value === 'number' || 
               (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(parseFloat(value)));
      });
      
      if (isNumeric) {
        numericColumns.push(column);
      } else {
        categoricalColumns.push(column);
      }
    });
    
    return { numeric: numericColumns, categorical: categoricalColumns };
  };

  const { numeric, categorical } = getColumns();

  // Generate chart based on selected options
  const generateChart = () => {
    if (!xAxis || !yAxis) {
      setError('Please select both X and Y axes');
      return;
    }

    if (!data || data.length === 0) {
      setError('No data available');
      return;
    }

    setError('');
    
    try {
      switch (chartType) {
        case 'bar':
          generateBarChart();
          break;
        case 'line':
          generateLineChart();
          break;
        case 'pie':
          generatePieChart();
          break;
        case 'scatter':
          generateScatterChart();
          break;
        default:
          setError('Unsupported chart type');
      }
    } catch (err) {
      setError('Error generating chart: ' + err.message);
    }
  };

  const generateBarChart = () => {
    // For bar chart, X-axis should be categorical, Y-axis should be numeric
    const labels = [...new Set(data.map(row => row[xAxis]))];
    const values = labels.map(label => {
      const matchingRows = data.filter(row => row[xAxis] === label);
      const sum = matchingRows.reduce((acc, row) => {
        const value = parseFloat(row[yAxis]);
        return acc + (isNaN(value) ? 0 : value);
      }, 0);
      return sum / matchingRows.length; // Average value
    });

    setChartData({
      labels,
      datasets: [
        {
          label: yAxis,
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    });

    setChartOptions({
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${yAxis} by ${xAxis}`,
        },
      },
    });
  };

  const generateLineChart = () => {
    // For line chart, we'll assume X-axis is time-based or sortable
    const sortedData = [...data].sort((a, b) => {
      if (typeof a[xAxis] === 'string' && typeof b[xAxis] === 'string') {
        return a[xAxis].localeCompare(b[xAxis]);
      }
      return a[xAxis] - b[xAxis];
    });

    const labels = sortedData.map(row => row[xAxis]);
    const values = sortedData.map(row => {
      const value = parseFloat(row[yAxis]);
      return isNaN(value) ? 0 : value;
    });

    setChartData({
      labels,
      datasets: [
        {
          label: yAxis,
          data: values,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    });

    setChartOptions({
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${yAxis} over ${xAxis}`,
        },
      },
    });
  };

  const generatePieChart = () => {
    // For pie chart, X-axis should be categorical, Y-axis should be numeric
    const labels = [...new Set(data.map(row => row[xAxis]))];
    const values = labels.map(label => {
      const matchingRows = data.filter(row => row[xAxis] === label);
      const sum = matchingRows.reduce((acc, row) => {
        const value = parseFloat(row[yAxis]);
        return acc + (isNaN(value) ? 0 : value);
      }, 0);
      return sum;
    });

    setChartData({
      labels,
      datasets: [
        {
          label: yAxis,
          data: values,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    });

    setChartOptions({
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${yAxis} distribution by ${xAxis}`,
        },
      },
    });
  };

  const generateScatterChart = () => {
    // For scatter chart, both axes should be numeric
    const points = data.map(row => ({
      x: parseFloat(row[xAxis]) || 0,
      y: parseFloat(row[yAxis]) || 0,
    })).filter(point => !isNaN(point.x) && !isNaN(point.y));

    setChartData({
      datasets: [
        {
          label: `${yAxis} vs ${xAxis}`,
          data: points,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        },
      ],
    });

    setChartOptions({
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${yAxis} vs ${xAxis}`,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: xAxis,
          },
        },
        y: {
          title: {
            display: true,
            text: yAxis,
          },
        },
      },
    });
  };

  // Reset chart when data changes
  useEffect(() => {
    setChartData(null);
    setChartOptions({});
    setXAxis('');
    setYAxis('');
  }, [data]);

  if (!data) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Visualization</h2>
        <p className="text-gray-600">Please upload a dataset to enable visualization features.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Visualization</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="scatter">Scatter Plot</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {chartType === 'scatter' ? 'X-Axis (Numeric)' : 'X-Axis'}
          </label>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            <option value="">Select column</option>
            {(chartType === 'scatter' ? numeric : [...numeric, ...categorical]).map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {chartType === 'pie' ? 'Values (Numeric)' : 'Y-Axis (Numeric)'}
          </label>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            <option value="">Select column</option>
            {numeric.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={generateChart}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none"
          >
            Generate Chart
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {chartData && (
        <div className="mt-6">
          <div className="h-96">
            {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
            {chartType === 'line' && <Line data={chartData} options={chartOptions} />}
            {chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
            {chartType === 'scatter' && <Scatter data={chartData} options={chartOptions} />}
          </div>
        </div>
      )}
      
      {!chartData && !error && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Visualization Instructions</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Select a chart type and choose appropriate columns for the X and Y axes to generate a visualization of your data.
                  Bar charts and pie charts work well with categorical data, while line charts and scatter plots are better for showing trends.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualization;
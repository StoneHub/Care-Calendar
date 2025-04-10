/**
 * Common theme utility classes to ensure consistent dark mode across components
 * 
 * These classes follow Tailwind CSS conventions:
 * - Light mode is the default appearance
 * - Dark mode variants use the 'dark:' prefix
 */
export const darkModeClasses = {
  // Basic colors and backgrounds
  background: 'bg-white dark:bg-gray-800',
  text: 'text-gray-800 dark:text-white',
  border: 'border-gray-200 dark:border-gray-700',
  
  // Form elements
  input: 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600',
  
  // Buttons
  button: {
    primary: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white'
  },
  
  // Container elements
  card: 'bg-white dark:bg-gray-800 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700',
  modal: 'bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700',
  header: 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700',
  listItem: 'hover:bg-gray-50 dark:hover:bg-gray-700'
};

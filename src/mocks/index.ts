/**
 * MOCK MODULE INDEX
 * Punto de entrada para el sistema de mocking
 */

export { mockService } from './mockService'
export { mockData } from './data'

// Helper to check if mock mode is enabled
export const isMockEnabled = (): boolean => {
  return import.meta.env.VITE_USE_MOCK === 'true'
}

// Console message for dev
if (isMockEnabled()) {
  console.log(
    '%c🎭 MOCK MODE ENABLED %c\n' +
    'Using local mock data instead of Firebase.\n' +
    'Data persists in localStorage.\n' +
    'Call mockService.reset() in console to reset data.',
    'background: #635BFF; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
    ''
  )
}

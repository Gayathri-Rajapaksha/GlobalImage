const React = require('react');

module.exports = {
  BrowserRouter: ({ children }) => React.createElement('div', { 'data-testid': 'mock-router' }, children),
  Routes: ({ children }) => React.createElement('div', { 'data-testid': 'mock-routes' }, children),
  Route: ({ element }) => React.createElement('div', { 'data-testid': 'mock-route' }, element),
  Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
  useNavigate: () => () => {},
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
};

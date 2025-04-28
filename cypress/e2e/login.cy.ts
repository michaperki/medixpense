
describe('Login Page', () => {
  it('loads the login page and logs console output', () => {
    cy.visit('/login');
    cy.contains('Sign In'); // Adjust based on your real text
  });
});

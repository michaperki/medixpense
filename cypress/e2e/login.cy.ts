describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('loads login form', () => {
    cy.get('h2').contains('Login');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').should('contain', 'Sign In');
  });

  it('shows error on invalid login', () => {
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('incorrectPassword');
    cy.get('button[type="submit"]').click();

    cy.contains('Invalid credentials').should('exist'); // <-- fixed
  });

  it('logs in and redirects to provider dashboard', () => {
    cy.get('input[name="email"]').type('provider@medixpense.com');
    cy.get('input[name="password"]').type('password123'); // Make sure this user exists!
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/provider/dashboard');
    cy.contains('Dashboard').should('exist');
  });
});

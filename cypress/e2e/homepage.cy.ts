describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads hero section and search form', () => {
    cy.contains('Find Healthcare Prices Near You');
    cy.get('form').within(() => {
      cy.get('select[name="procedure"]').should('exist');
      cy.get('input[name="location"]').should('exist');
      cy.get('button[type="submit"]').should('contain', 'Search');
    });
  });

  it('submits search form and navigates to search page', () => {
    cy.get('select[name="procedure"]').select('MRI Brain without contrast');
    cy.get('input[name="location"]').type('Dallas, TX');
    cy.get('button[type="submit"]').click(); // <-- corrected
    cy.url().should('include', '/search');
    cy.url().should('include', 'query=MRI+Brain+without+contrast');
    cy.url().should('include', 'location=Dallas%2C+TX');
  });

  it('shows procedure categories', () => {
    cy.contains('Browse by Category');
    cy.contains('Diagnostic Imaging');
    cy.contains('Preventive Care');
    cy.contains('Laboratory');
  });

  it('has provider registration CTA', () => {
    cy.contains('Are you a healthcare provider?');
    cy.contains('Register Now').should('have.attr', 'href', '/register');
    cy.contains('Learn more').should('have.attr', 'href', '/about');
  });
});


describe('Profile Page', () => {
  it('redirects to login if not authenticated', () => {
    cy.visit('/profile');
    cy.url().should('include', '/login'); // adjust based on your app behavior
  });
});

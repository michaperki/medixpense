// Add this to your seeds folder as location-seeds.js

const sampleLocations = [
  {
    name: 'Main Office',
    address1: '123 Medical Plaza',
    address2: 'Suite 100',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    phone: '555-123-4567',
    latitude: 34.052235,
    longitude: -118.243683
  },
  {
    name: 'North Branch',
    address1: '456 Healthcare Drive',
    city: 'Sacramento',
    state: 'CA',
    zipCode: '95814',
    phone: '555-987-6543',
    latitude: 38.575764,
    longitude: -121.478851
  },
  {
    name: 'East Side Clinic',
    address1: '789 Wellness Road',
    address2: 'Building B',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103',
    phone: '555-456-7890',
    latitude: 37.774929,
    longitude: -122.419418
  }
];

module.exports = { sampleLocations };

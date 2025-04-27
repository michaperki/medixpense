// packages/database/prisma/seeds/location-seeds.js

// Sample hours for each location
const locationHours = {
  mainOffice: {
    monday: "8:00 AM - 6:00 PM",
    tuesday: "8:00 AM - 6:00 PM",
    wednesday: "8:00 AM - 6:00 PM",
    thursday: "8:00 AM - 6:00 PM",
    friday: "8:00 AM - 5:00 PM",
    saturday: "9:00 AM - 1:00 PM",
    sunday: "Closed"
  },
  northBranch: {
    monday: "7:30 AM - 7:00 PM",
    tuesday: "7:30 AM - 7:00 PM",
    wednesday: "7:30 AM - 7:00 PM",
    thursday: "7:30 AM - 7:00 PM",
    friday: "7:30 AM - 5:30 PM",
    saturday: "Closed",
    sunday: "Closed"
  },
  eastSideClinic: {
    monday: "9:00 AM - 5:00 PM",
    tuesday: "9:00 AM - 5:00 PM",
    wednesday: "9:00 AM - 5:00 PM",
    thursday: "9:00 AM - 5:00 PM",
    friday: "9:00 AM - 5:00 PM",
    saturday: "10:00 AM - 2:00 PM",
    sunday: "Closed"
  }
};

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
    longitude: -118.243683,
    hours: locationHours.mainOffice
  },
  {
    name: 'North Branch',
    address1: '456 Healthcare Drive',
    city: 'Sacramento',
    state: 'CA',
    zipCode: '95814',
    phone: '555-987-6543',
    latitude: 38.575764,
    longitude: -121.478851,
    hours: locationHours.northBranch
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
    longitude: -122.419418,
    hours: locationHours.eastSideClinic
  }
];

module.exports = { sampleLocations };

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const defaultUsers = [
  {
    name: 'HotelIQ Admin',
    email: 'admin@hoteliqkenya.co.ke',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Guesthouse Owner',
    email: 'owner@hoteliqkenya.co.ke',
    password: 'Owner@123',
    role: 'admin',
  },
  {
    name: 'Receptionist Agent',
    email: 'agent@hoteliqkenya.co.ke',
    password: 'Agent@123',
    role: 'agent',
    permissions: ['view_dashboard', 'view_properties', 'edit_properties'],
  },
  {
    name: 'Normal User Guest',
    email: 'guest@hoteliqkenya.co.ke',
    password: 'Guest@123',
    role: 'tenant',
  },
  {
    name: 'Sirikwa Owner',
    email: 'sirikwa@hoteliqkenya.co.ke',
    password: 'Owner@123',
    role: 'admin',
  },
  {
    name: 'Boma Owner',
    email: 'boma@hoteliqkenya.co.ke',
    password: 'Owner@123',
    role: 'admin',
  },
  {
    name: 'Wagon Owner',
    email: 'wagon@hoteliqkenya.co.ke',
    password: 'Owner@123',
    role: 'admin',
  },
];

const mockEvents = [
  {
    name: 'Eldoret City Marathon',
    description: 'One of the highest-paying marathons in Africa, attracting elite athletes to Eldoret.',
    category: 'sports',
    startDate: new Date('2026-04-12T00:00:00.000Z'),
    endDate: new Date('2026-04-12T23:59:59.000Z'),
    county: 'Uasin Gishu',
    town: 'Eldoret',
    latitude: 0.5143,
    longitude: 35.2698,
    regionRelevance: ['Eldoret', 'Nandi', 'Elgeyo Marakwet'],
    demandImpact: 'high',
    isNational: false,
  },
  {
    name: 'KNCCI Summit 2026',
    description: 'Kenya National Chamber of Commerce & Industry business summit at Rupa Mall, Eldoret.',
    category: 'conference',
    startDate: new Date('2026-07-23T00:00:00.000Z'),
    endDate: new Date('2026-07-25T23:59:59.000Z'),
    county: 'Uasin Gishu',
    town: 'Eldoret',
    latitude: 0.5218,
    longitude: 35.2905,
    regionRelevance: ['Eldoret', 'Uasin Gishu'],
    demandImpact: 'high',
    isNational: false,
  },
  {
    name: 'The Cube Digital Health Innovation Challenge 2026',
    description: 'National digital health hackathon and innovation contest at Rupa Mall, Eldoret.',
    category: 'conference',
    startDate: new Date('2026-07-23T00:00:00.000Z'),
    endDate: new Date('2026-07-25T23:59:59.000Z'),
    county: 'Uasin Gishu',
    town: 'Eldoret',
    latitude: 0.5218,
    longitude: 35.2905,
    regionRelevance: ['Eldoret', 'Uasin Gishu'],
    demandImpact: 'high',
    isNational: false,
  },
  {
    name: 'Rift Valley Agri-Business Expo',
    description: 'Annual agricultural show presenting farming innovation and tech in Eldoret.',
    category: 'conference',
    startDate: new Date('2026-09-10T00:00:00.000Z'),
    endDate: new Date('2026-09-13T23:59:59.000Z'),
    county: 'Uasin Gishu',
    town: 'Eldoret',
    latitude: 0.5220,
    longitude: 35.2815,
    regionRelevance: ['Eldoret', 'Kitale', 'Kericho'],
    demandImpact: 'medium',
    isNational: false,
  },
  {
    name: 'Eldoret Cultural & Food Festival',
    description: 'Celebrating North Rift heritage, food, music and arts in Eldoret town.',
    category: 'festival',
    startDate: new Date('2026-10-20T00:00:00.000Z'),
    endDate: new Date('2026-10-22T23:59:59.000Z'),
    county: 'Uasin Gishu',
    town: 'Eldoret',
    latitude: 0.5150,
    longitude: 35.2700,
    regionRelevance: ['Eldoret'],
    demandImpact: 'high',
    isNational: false,
  },
  {
    name: 'The Naiberi River Campsite & Restaurant',
    description: 'Rustic log design restaurant, resort and bar located 16km outside Eldoret.',
    category: 'restaurant',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2030-12-31T23:59:59.000Z'),
    county: 'Uasin Gishu',
    town: 'Eldoret',
    latitude: 0.4485,
    longitude: 35.3950,
    regionRelevance: ['Eldoret'],
    demandImpact: 'low',
    isNational: false,
  },
  {
    name: 'Supa Loaf Eldoret Restaurant',
    description: 'Popular bakery cafe serving breakfast and meals in the Eldoret town center.',
    category: 'restaurant',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2030-12-31T23:59:59.000Z'),
    county: 'Uasin Gishu',
    town: 'Eldoret',
    latitude: 0.5135,
    longitude: 35.2705,
    regionRelevance: ['Eldoret'],
    demandImpact: 'low',
    isNational: false,
  },
  {
    name: 'Jamhuri Day',
    description: 'Celebrating Kenyas independence and republic status.',
    category: 'public-holiday',
    startDate: new Date('2026-12-12T00:00:00.000Z'),
    endDate: new Date('2026-12-12T23:59:59.000Z'),
    county: 'Nairobi',
    town: 'Nairobi',
    latitude: -1.2921,
    longitude: 36.8219,
    regionRelevance: ['Nairobi', 'Mombasa', 'Kisumu', 'Eldoret'],
    demandImpact: 'high',
    isNational: true,
  },
  {
    name: 'Madaraka Day',
    description: 'Commemorating the day Kenya attained internal self-rule.',
    category: 'public-holiday',
    startDate: new Date('2026-06-01T00:00:00.000Z'),
    endDate: new Date('2026-06-01T23:59:59.000Z'),
    county: 'Nairobi',
    town: 'Nairobi',
    latitude: -1.2921,
    longitude: 36.8219,
    regionRelevance: ['Nairobi'],
    demandImpact: 'medium',
    isNational: true,
  },
  {
    name: 'Mombasa Carnival',
    description: 'Annual cultural festival on Mombasa island featuring parades and dance.',
    category: 'festival',
    startDate: new Date('2026-11-15T00:00:00.000Z'),
    endDate: new Date('2026-11-20T23:59:59.000Z'),
    county: 'Mombasa',
    town: 'Mombasa',
    latitude: -4.0500,
    longitude: 39.6667,
    regionRelevance: ['Mombasa', 'Kwale', 'Kilifi'],
    demandImpact: 'high',
    isNational: false,
  },
  {
    name: 'Wildebeest Migration Peak',
    description: 'The spectacular migration of wildebeest crossing the Mara River.',
    category: 'wildlife-season',
    startDate: new Date('2026-07-15T00:00:00.000Z'),
    endDate: new Date('2026-08-30T23:59:59.000Z'),
    county: 'Narok',
    town: 'Masai Mara',
    latitude: -1.5333,
    longitude: 35.0000,
    regionRelevance: ['Narok'],
    demandImpact: 'high',
    isNational: false,
  },
];

const propertiesToSeed = [
  {
    ownerEmail: 'owner@hoteliqkenya.co.ke',
    name: 'Mombasa Ocean Breeze Lodge',
    county: 'Mombasa',
    town: 'Mombasa',
    address: 'Nyali Beach Road',
    latitude: -4.0253,
    longitude: 39.7123,
    contactPhone: '0712345678',
    contactEmail: 'info@oceanbreezelodge.co.ke',
  },
  {
    ownerEmail: 'sirikwa@hoteliqkenya.co.ke',
    name: 'Eldoret Sirikwa Hotel',
    county: 'Uasin Gishu',
    town: 'Eldoret',
    address: 'Elgeyo Road, Eldoret',
    latitude: 0.5126,
    longitude: 35.2711,
    contactPhone: '0722000111',
    contactEmail: 'info@sirikwahotel.co.ke',
  },
  {
    ownerEmail: 'boma@hoteliqkenya.co.ke',
    name: 'The Boma Inn Eldoret',
    county: 'Uasin Gishu',
    town: 'Eldoret',
    address: 'Elgon View, Eldoret',
    latitude: 0.5050,
    longitude: 35.2810,
    contactPhone: '0722222333',
    contactEmail: 'info@bomainneldoret.co.ke',
  },
  {
    ownerEmail: 'wagon@hoteliqkenya.co.ke',
    name: 'Eldoret Wagon Hotel',
    county: 'Uasin Gishu',
    town: 'Eldoret',
    address: 'Oloo Street, Eldoret',
    latitude: 0.5172,
    longitude: 35.2689,
    contactPhone: '0722444555',
    contactEmail: 'info@wagonhotel.co.ke',
  },
];

async function main() {
  console.log('Seeding database...');

  // 1. Seed Users
  const userMap = {};
  for (const u of defaultUsers) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {
        name: u.name,
        password: hashedPassword,
        role: u.role,
        permissions: u.permissions || [],
        isActive: true,
        isApproved: true,
        isEmailVerified: true,
        isDeleted: false,
      },
      create: {
        name: u.name,
        email: u.email.toLowerCase(),
        password: hashedPassword,
        role: u.role,
        permissions: u.permissions || [],
        isActive: true,
        isApproved: true,
        isEmailVerified: true,
      },
    });
    userMap[u.email] = user;
    console.log(`Seeded user: ${user.email}`);
  }

  // 2. Clear previous KenyanEvents and seed new ones
  await prisma.kenyanEvent.deleteMany({});
  for (const me of mockEvents) {
    await prisma.kenyanEvent.create({
      data: me,
    });
    console.log(`Seeded event: ${me.name}`);
  }

  // 3. Seed Properties, Rooms, and Bookings
  const roomMap = {};
  const propertyMap = {};

  for (const pConfig of propertiesToSeed) {
    const pOwner = userMap[pConfig.ownerEmail];
    if (!pOwner) continue;

    const property = await prisma.property.upsert({
      where: { ownerId: pOwner.id },
      update: {
        name: pConfig.name,
        county: pConfig.county,
        town: pConfig.town,
        address: pConfig.address,
        latitude: pConfig.latitude,
        longitude: pConfig.longitude,
        contactPhone: pConfig.contactPhone,
        contactEmail: pConfig.contactEmail,
        isActive: true,
      },
      create: {
        name: pConfig.name,
        county: pConfig.county,
        town: pConfig.town,
        address: pConfig.address,
        latitude: pConfig.latitude,
        longitude: pConfig.longitude,
        contactPhone: pConfig.contactPhone,
        contactEmail: pConfig.contactEmail,
        ownerId: pOwner.id,
        isActive: true,
      },
    });
    console.log(`Seeded property: ${property.name}`);
    propertyMap[pConfig.name] = property;

    // Link property to owner
    await prisma.user.update({
      where: { id: pOwner.id },
      data: {
        tenantIds: [property.id],
        activeTenantId: property.id,
      },
    });

    // Seed Rooms for this property
    const roomsData = [
      { roomNumber: '101', roomType: 'Standard', basePrice: pConfig.town === 'Eldoret' ? 4500 : 5000, capacity: 2, amenities: ['WiFi', 'TV', 'AC'] },
      { roomNumber: '102', roomType: 'Standard', basePrice: pConfig.town === 'Eldoret' ? 4500 : 5000, capacity: 2, amenities: ['WiFi', 'TV', 'AC'] },
      { roomNumber: '201', roomType: 'Deluxe', basePrice: pConfig.town === 'Eldoret' ? 7000 : 8000, capacity: 3, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'] },
      { roomNumber: '202', roomType: 'Deluxe', basePrice: pConfig.town === 'Eldoret' ? 7000 : 8000, capacity: 3, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'] },
      { roomNumber: '301', roomType: 'Executive Suite', basePrice: pConfig.town === 'Eldoret' ? 12000 : 15000, capacity: 4, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi'] },
    ];

    for (const rd of roomsData) {
      const room = await prisma.room.upsert({
        where: {
          propertyId_roomNumber: {
            propertyId: property.id,
            roomNumber: rd.roomNumber,
          },
        },
        update: {
          roomType: rd.roomType,
          basePrice: rd.basePrice,
          capacity: rd.capacity,
          amenities: rd.amenities,
          isActive: true,
        },
        create: {
          propertyId: property.id,
          roomNumber: rd.roomNumber,
          roomType: rd.roomType,
          basePrice: rd.basePrice,
          capacity: rd.capacity,
          amenities: rd.amenities,
          isActive: true,
        },
      });
      roomMap[`${property.id}_${rd.roomNumber}`] = room;
      console.log(`Seeded room: ${room.roomNumber} for property: ${property.name}`);
    }

    // Seed synthetic bookings for this property
    const bookingsData = [
      { roomNum: '101', guest: 'John Doe', phone: '0711223344', email: 'john@gmail.com', checkIn: '2026-06-01', checkOut: '2026-06-05', status: 'checked-out', price: pConfig.town === 'Eldoret' ? 4500 : 5000 },
      { roomNum: '201', guest: 'Jane Smith', phone: '0722334455', email: 'jane@gmail.com', checkIn: '2026-06-10', checkOut: '2026-06-12', status: 'checked-out', price: pConfig.town === 'Eldoret' ? 7000 : 8000 },
      { roomNum: '102', guest: 'David Kimani', phone: '0733445566', email: 'david@gmail.com', checkIn: '2026-06-25', checkOut: '2026-06-28', status: 'checked-out', price: pConfig.town === 'Eldoret' ? 4500 : 5000 },
      { roomNum: '101', guest: 'Alice Wambua', phone: '0701234567', email: 'alice@gmail.com', checkIn: '2026-07-02', checkOut: '2026-07-06', status: 'checked-in', price: pConfig.town === 'Eldoret' ? 4500 : 5000 },
      { roomNum: '202', guest: 'Bob Ndwiga', phone: '0755667788', email: 'bob@gmail.com', checkIn: '2026-07-04', checkOut: '2026-07-07', status: 'checked-in', price: pConfig.town === 'Eldoret' ? 7000 : 8000 },
    ];

    for (const bd of bookingsData) {
      const room = roomMap[`${property.id}_${bd.roomNum}`];
      if (!room) continue;
      const checkInDate = new Date(bd.checkIn);
      const checkOutDate = new Date(bd.checkOut);
      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const totalPrice = bd.price * nights;

      // Clean existing bookings first to avoid duplicates when running seeds repeatedly
      await prisma.booking.deleteMany({
        where: {
          propertyId: property.id,
          roomId: room.id,
          checkIn: checkInDate,
        }
      });

      await prisma.booking.create({
        data: {
          propertyId: property.id,
          roomId: room.id,
          guestName: bd.guest,
          guestPhone: bd.phone,
          guestEmail: bd.email,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          status: bd.status,
          pricePerNight: bd.price,
          totalPrice,
          source: 'direct',
        },
      });
    }
    console.log(`Seeded default bookings for property: ${property.name}`);
  }

  // 4. Link receptionist to the first property
  const receptionist = userMap['agent@hoteliqkenya.co.ke'];
  const firstProperty = propertyMap['Mombasa Ocean Breeze Lodge'];
  if (receptionist && firstProperty) {
    await prisma.user.update({
      where: { id: receptionist.id },
      data: {
        tenantIds: [firstProperty.id],
        activeTenantId: firstProperty.id,
      },
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

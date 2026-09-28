import bcrypt from 'bcrypt';
import prisma from '../app/utils/prisma';

async function main() {
  console.log('--- Seeding Initial Database Data ---');

  const hashedPassword = await bcrypt.hash('123456', 12);

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'nafi.cse0123@gmail.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      name: 'System Admin (Nafi)',
    },
    create: {
      name: 'System Admin (Nafi)',
      email: 'nafi.cse0123@gmail.com',
      password: hashedPassword,
      phone: '+8801711000001',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`✅ Admin user created: ${admin.email} (${admin.role})`);

  // 2. Create Manager User
  const manager = await prisma.user.upsert({
    where: { email: 'nafi.mahmud0123@gmail.com' },
    update: {
      password: hashedPassword,
      role: 'MANAGER',
      isActive: true,
      isVerified: true,
      name: 'Garage Manager (Nafi Mahmud)',
    },
    create: {
      name: 'Garage Manager (Nafi Mahmud)',
      email: 'nafi.mahmud0123@gmail.com',
      password: hashedPassword,
      phone: '+8801711000002',
      role: 'MANAGER',
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`✅ Manager user created: ${manager.email} (${manager.role})`);

  // 3. Create Customer / Driver User
  const customer = await prisma.user.upsert({
    where: { email: 'nafi2122940@gmail.com' },
    update: {
      password: hashedPassword,
      role: 'DRIVER',
      isActive: true,
      isVerified: true,
      name: 'Customer Driver (Nafi)',
    },
    create: {
      name: 'Customer Driver (Nafi)',
      email: 'nafi2122940@gmail.com',
      password: hashedPassword,
      phone: '+8801711000003',
      role: 'DRIVER',
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`✅ Customer user created: ${customer.email} (${customer.role})`);

  // 4. Create Garages under the Manager
  const sampleGarages = [
    {
      name: 'Central Plaza Multi-Level Parking',
      address: 'Plot 12, Road 27, Block D, Dhanmondi, Dhaka 1209',
      location: 'Dhanmondi 27, Dhaka',
      latitude: 23.7508,
      longitude: 90.3752,
      totalSlots: 40,
      availableSlots: 28,
      pricePerHour: 60,
      description:
        'Modern automated multi-level underground parking facility with 24/7 CCTV surveillance, fire protection, on-site security guards, and EV charging points.',
      averageRating: 4.8,
      totalReviews: 24,
      images: [
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1000&q=80',
      ],
      ownerId: manager.id,
    },
    {
      name: 'Gulshan Avenue Smart Garage',
      address: 'Avenue Tower, Gulshan-2 Circle, Dhaka 1212',
      location: 'Gulshan-2, Dhaka',
      latitude: 23.7925,
      longitude: 90.4152,
      totalSlots: 60,
      availableSlots: 45,
      pricePerHour: 100,
      description:
        'Premium indoor parking facility with automated ticket gates, license plate recognition cameras, accessible bays, and on-demand car wash service.',
      averageRating: 4.9,
      totalReviews: 38,
      images: [
        'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80',
      ],
      ownerId: manager.id,
    },
    {
      name: 'Banani Commercial Parking Hub',
      address: 'House 45, Road 11, Block F, Banani, Dhaka 1213',
      location: 'Banani 11, Dhaka',
      latitude: 23.7937,
      longitude: 90.4043,
      totalSlots: 30,
      availableSlots: 12,
      pricePerHour: 80,
      description:
        'Covered parking facility right in the heart of Banani 11 shopping and restaurant district. Easy dual-lane ramp access and round-the-clock guards.',
      averageRating: 4.7,
      totalReviews: 19,
      images: [
        'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1000&q=80',
      ],
      ownerId: manager.id,
    },
    {
      name: 'Uttara Airport Express Terminal Garage',
      address: 'Sector 3, Jashimuddin Avenue, Uttara, Dhaka 1230',
      location: 'Uttara Sector 3, Dhaka',
      latitude: 23.8682,
      longitude: 90.3986,
      totalSlots: 50,
      availableSlots: 35,
      pricePerHour: 50,
      description:
        'Spacious, illuminated parking ground close to Dhaka Airport Highway & Metro Line. Ideal for daily commuters, airport travelers and overnight parking.',
      averageRating: 4.6,
      totalReviews: 15,
      images: [
        'https://images.unsplash.com/photo-1543465077-db45d34b88a5?auto=format&fit=crop&w=1000&q=80',
      ],
      ownerId: manager.id,
    },
  ];

  for (const garageData of sampleGarages) {
    const createdGarage = await prisma.garage.create({
      data: garageData,
    });
    console.log(`🅿 Created garage: "${createdGarage.name}" (ID: ${createdGarage.id})`);
  }

  // 5. Add vehicle for the customer
  await prisma.vehicle.upsert({
    where: {
      userId_vehicleNumber: {
        userId: customer.id,
        vehicleNumber: 'DHA-GA-11-2093',
      },
    },
    update: {},
    create: {
      userId: customer.id,
      vehicleNumber: 'DHA-GA-11-2093',
      vehicleType: 'CAR',
      model: 'Toyota Corolla Cross',
      color: 'Pearl White',
      isDefault: true,
    },
  });
  console.log(`🚗 Created default vehicle for customer: DHA-GA-11-2093`);

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

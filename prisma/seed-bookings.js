const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding authentic pool bookings and operations data...");

  // Customer profiles
  const customers = [
    { phone: "+919847123456", name: "Arun Kumar", place: "Calicut", email: "arun.kumar@gmail.com" },
    { phone: "+919745567890", name: "Faisal Rahman", place: "Tirur", email: "faisal.r@gmail.com" },
    { phone: "+919447011223", name: "Sneha Nair", place: "Kottakkal", email: "sneha.n@gmail.com" },
    { phone: "+919895033445", name: "Mohammed Shafi", place: "Moonniyur", email: "shafi.m@gmail.com" },
    { phone: "+919846012345", name: "Anoop Varma", place: "Calicut", email: "anoop.v@gmail.com" },
    { phone: "+919946077889", name: "Dr. Hashim & Family", place: "Malappuram", email: "dr.hashim@gmail.com" },
    { phone: "+919846288990", name: "Kabeer Chemmad & Family", place: "Chemmad", email: "kabeer.ch@gmail.com" },
    { phone: "+919744155667", name: "Jamsheer Ali & Friends", place: "Calicut", email: "jamsheer.ali@gmail.com" },
    { phone: "+919800011122", name: "Suresh Menon", place: "Kondotty", email: "suresh.m@gmail.com" },
    { phone: "+919995544332", name: "Nidheesh Baby & Family", place: "Manjeri", email: "nidheesh@gmail.com" },
    { phone: "+919847099887", name: "Rashid Parambil", place: "Parappanangadi", email: "rashid.p@gmail.com" },
  ];

  const customerMap = {};
  for (const c of customers) {
    const cust = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: { name: c.name, place: c.place, email: c.email },
      create: { phone: c.phone, name: c.name, place: c.place, email: c.email },
    });
    customerMap[c.phone] = cust.id;
  }

  // Today's Date in IST: 2026-11-14
  // Yesterday: 2026-11-13
  // Tomorrow: 2026-11-15

  const bookingsToSeed = [
    // --- TODAY (2026-11-14) ---
    {
      id: "MAK-20261114-001",
      type: "PUBLIC",
      status: "CONFIRMED",
      bookingDate: "2026-11-14",
      startTime: "09:00",
      endTime: "10:00",
      durationHours: 1,
      guestCount: 4,
      basePrice: 600,
      extraGuestPrice: 0,
      totalAmount: 600,
      advanceRequired: 600,
      totalPaid: 600,
      balanceAmount: 0,
      paymentStatus: "PAID",
      customerPhone: "+919847123456",
      customerName: "Arun Kumar",
      customerPlace: "Calicut",
      notes: "Checked in at 09:05 AM",
      checkInStatus: "CHECKED_IN",
      qrToken: "MAKPASS-261114-001",
    },
    {
      id: "MAK-20261114-002",
      type: "PUBLIC",
      status: "CONFIRMED",
      bookingDate: "2026-11-14",
      startTime: "10:00",
      endTime: "11:00",
      durationHours: 1,
      guestCount: 6,
      basePrice: 900,
      extraGuestPrice: 0,
      totalAmount: 900,
      advanceRequired: 900,
      totalPaid: 900,
      balanceAmount: 0,
      paymentStatus: "PAID",
      customerPhone: "+919745567890",
      customerName: "Faisal Rahman",
      customerPlace: "Tirur",
      notes: "Checked in at 10:02 AM",
      checkInStatus: "CHECKED_IN",
      qrToken: "MAKPASS-261114-002",
    },
    {
      id: "MAK-20261114-003",
      type: "PUBLIC",
      status: "CONFIRMED",
      bookingDate: "2026-11-14",
      startTime: "11:00",
      endTime: "12:00",
      durationHours: 1,
      guestCount: 5,
      basePrice: 750,
      extraGuestPrice: 0,
      totalAmount: 750,
      advanceRequired: 750,
      totalPaid: 750,
      balanceAmount: 0,
      paymentStatus: "PAID",
      customerPhone: "+919447011223",
      customerName: "Sneha Nair",
      customerPlace: "Kottakkal",
      checkInStatus: "PENDING",
      qrToken: "MAKPASS-261114-003",
    },
    {
      id: "MAK-20261114-004",
      type: "PUBLIC",
      status: "CONFIRMED",
      bookingDate: "2026-11-14",
      startTime: "14:00",
      endTime: "15:00",
      durationHours: 1,
      guestCount: 3,
      basePrice: 450,
      extraGuestPrice: 0,
      totalAmount: 450,
      advanceRequired: 450,
      totalPaid: 450,
      balanceAmount: 0,
      paymentStatus: "PAID",
      customerPhone: "+919895033445",
      customerName: "Mohammed Shafi",
      customerPlace: "Moonniyur",
      checkInStatus: "PENDING",
      qrToken: "MAKPASS-261114-004",
    },
    {
      id: "MAK-20261114-005",
      type: "PUBLIC",
      status: "CONFIRMED",
      bookingDate: "2026-11-14",
      startTime: "15:00",
      endTime: "16:00",
      durationHours: 1,
      guestCount: 4,
      basePrice: 600,
      extraGuestPrice: 0,
      totalAmount: 600,
      advanceRequired: 600,
      totalPaid: 600,
      balanceAmount: 0,
      paymentStatus: "PAID",
      customerPhone: "+919846012345",
      customerName: "Anoop Varma",
      customerPlace: "Calicut",
      checkInStatus: "PENDING",
      qrToken: "MAKPASS-261114-005",
    },
    {
      id: "MAK-20261114-006",
      type: "FAMILY",
      status: "CONFIRMED",
      bookingDate: "2026-11-14",
      startTime: "16:00",
      endTime: "18:00",
      durationHours: 2,
      guestCount: 12,
      basePrice: 3000,
      extraGuestPrice: 0,
      totalAmount: 3000,
      advanceRequired: 750,
      totalPaid: 750,
      balanceAmount: 2250,
      paymentStatus: "PARTIAL",
      customerPhone: "+919946077889",
      customerName: "Dr. Hashim & Family",
      customerPlace: "Malappuram",
      notes: "Advance ₹750 paid online via UPI. Balance ₹2,250 due upon arrival.",
      checkInStatus: "PENDING",
      qrToken: "MAKPASS-261114-006",
    },
    {
      id: "MAK-20261114-007",
      type: "FAMILY",
      status: "CONFIRMED",
      bookingDate: "2026-11-14",
      startTime: "19:00",
      endTime: "21:00",
      durationHours: 2,
      guestCount: 15,
      basePrice: 3000,
      extraGuestPrice: 600,
      totalAmount: 3600,
      advanceRequired: 750,
      totalPaid: 750,
      balanceAmount: 2850,
      paymentStatus: "PARTIAL",
      customerPhone: "+919846288990",
      customerName: "Kabeer Chemmad & Family",
      customerPlace: "Chemmad",
      notes: "15 guests (3 extra). Advance ₹750 paid online. Balance ₹2,850 due.",
      checkInStatus: "PENDING",
      qrToken: "MAKPASS-261114-007",
    },
    {
      id: "MAK-20261114-008",
      type: "FAMILY",
      status: "CONFIRMED",
      bookingDate: "2026-11-14",
      startTime: "21:00",
      endTime: "23:00",
      durationHours: 2,
      guestCount: 10,
      basePrice: 3000,
      extraGuestPrice: 0,
      totalAmount: 3000,
      advanceRequired: 750,
      totalPaid: 3000,
      balanceAmount: 0,
      paymentStatus: "PAID",
      customerPhone: "+919744155667",
      customerName: "Jamsheer Ali & Friends",
      customerPlace: "Calicut",
      notes: "Fully paid online. Birthday celebration swim.",
      checkInStatus: "PENDING",
      qrToken: "MAKPASS-261114-008",
    },

    // --- YESTERDAY (2026-11-13) ---
    {
      id: "MAK-20261113-001",
      type: "PUBLIC",
      status: "COMPLETED",
      bookingDate: "2026-11-13",
      startTime: "10:00",
      endTime: "11:00",
      durationHours: 1,
      guestCount: 5,
      basePrice: 750,
      extraGuestPrice: 0,
      totalAmount: 750,
      advanceRequired: 750,
      totalPaid: 750,
      balanceAmount: 0,
      paymentStatus: "PAID",
      customerPhone: "+919800011122",
      customerName: "Suresh Menon",
      customerPlace: "Kondotty",
      notes: "Checked in at 10:00 AM",
      checkInStatus: "CHECKED_IN",
      qrToken: "MAKPASS-261113-001",
    },
    {
      id: "MAK-20261113-002",
      type: "FAMILY",
      status: "COMPLETED",
      bookingDate: "2026-11-13",
      startTime: "17:00",
      endTime: "19:00",
      durationHours: 2,
      guestCount: 12,
      basePrice: 3000,
      extraGuestPrice: 0,
      totalAmount: 3000,
      advanceRequired: 750,
      totalPaid: 3000,
      balanceAmount: 0,
      paymentStatus: "PAID",
      customerPhone: "+919995544332",
      customerName: "Nidheesh Baby & Family",
      customerPlace: "Manjeri",
      notes: "Completed without issues. Full payment settled.",
      checkInStatus: "CHECKED_IN",
      qrToken: "MAKPASS-261113-002",
    },

    // --- TOMORROW (2026-11-15 - Sunday) ---
    {
      id: "MAK-20261115-001",
      type: "PUBLIC",
      status: "CONFIRMED",
      bookingDate: "2026-11-15",
      startTime: "09:00",
      endTime: "10:00",
      durationHours: 1,
      guestCount: 8,
      basePrice: 1200,
      extraGuestPrice: 0,
      totalAmount: 1200,
      advanceRequired: 1200,
      totalPaid: 1200,
      balanceAmount: 0,
      paymentStatus: "PAID",
      customerPhone: "+919847099887",
      customerName: "Rashid Parambil",
      customerPlace: "Parappanangadi",
      checkInStatus: "PENDING",
      qrToken: "MAKPASS-261115-001",
    },
    {
      id: "MAK-20261115-002",
      type: "FAMILY",
      status: "CONFIRMED",
      bookingDate: "2026-11-15",
      startTime: "16:00",
      endTime: "19:00",
      durationHours: 3,
      guestCount: 14,
      basePrice: 4500,
      extraGuestPrice: 600,
      totalAmount: 5100,
      advanceRequired: 750,
      totalPaid: 750,
      balanceAmount: 4350,
      paymentStatus: "PARTIAL",
      customerPhone: "+919847123456",
      customerName: "Arun Kumar & Family",
      customerPlace: "Calicut",
      notes: "Sunday family celebration. 3-hour exclusive slot.",
      checkInStatus: "PENDING",
      qrToken: "MAKPASS-261115-002",
    },
  ];

  for (const b of bookingsToSeed) {
    const custId = customerMap[b.customerPhone];
    const createdBooking = await prisma.booking.upsert({
      where: { id: b.id },
      update: {
        ...b,
        customerId: custId,
      },
      create: {
        ...b,
        customerId: custId,
      },
    });

    // Create Payment record for advance / total paid
    if (b.totalPaid > 0) {
      await prisma.payment.upsert({
        where: { idempotencyKey: `TXN-${b.id}-INIT` },
        update: {},
        create: {
          bookingId: b.id,
          amount: b.totalPaid,
          method: "UPI",
          status: "SUCCESS",
          transactionRef: `TXN-${b.id}-INIT`,
          idempotencyKey: `TXN-${b.id}-INIT`,
          gatewayPaymentId: `pay_razor_${b.id.toLowerCase()}`,
          notes: b.paymentStatus === "PAID" ? "Full payment received via UPI" : "Online reservation advance payment",
          createdAt: new Date(`${b.bookingDate}T08:00:00+05:30`),
        },
      });

      // Create Receipt
      const cleanDate = b.bookingDate.replace(/-/g, "");
      await prisma.receipt.upsert({
        where: { receiptNumber: `REC-${cleanDate}-${b.id.split("-").pop()}` },
        update: {},
        create: {
          bookingId: b.id,
          receiptNumber: `REC-${cleanDate}-${b.id.split("-").pop()}`,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          totalAmount: b.totalAmount,
          paidAmount: b.totalPaid,
          balanceAmount: b.balanceAmount,
          paymentMethod: "UPI",
          issuedAt: new Date(`${b.bookingDate}T08:05:00+05:30`),
        },
      });
    }
  }

  // Also seed an active walk-in entry for live occupancy
  await prisma.walkIn.create({
    data: {
      visitorCount: 4,
      checkInTime: new Date(),
      durationHours: 1,
      ratePerHour: 150,
      calculatedCharge: 600,
      collectedAmount: 600,
      paymentMethod: "CASH",
      status: "ACTIVE",
      customerName: "Walk-in Guest",
      customerPhone: "+919800099999",
    },
  });

  // Seed today's water reading
  await prisma.waterReading.create({
    data: {
      date: "2026-11-14",
      time: "08:30",
      chlorinePpm: 2.0,
      phLevel: 7.4,
      waterClarity: "CLEAR",
      temperatureC: 28.5,
      status: "OPTIMAL",
      remarks: "Routine morning balance check – parameters optimal.",
    },
  });

  console.log(`Successfully seeded ${bookingsToSeed.length} bookings, customer profiles, receipts, and live operational data!`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

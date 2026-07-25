import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL || "owner@lawfirm.com";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD || "ChangeMe123!";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@lawfirm.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("Seeding Law Library Management System...\n");

  // ------------------------------------------------------------
  // 1. Website Owner (pure login account, not tied to an Employee)
  // ------------------------------------------------------------
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {},
    create: {
      email: OWNER_EMAIL,
      passwordHash: await hash(OWNER_PASSWORD),
      role: "WEBSITE_OWNER",
    },
  });
  console.log(`Website Owner ready: ${owner.email}`);

  // ------------------------------------------------------------
  // 2. Employees (staff who can borrow books)
  // ------------------------------------------------------------
  const employeeSeeds = [
    {
      employeeCode: "EMP-0001",
      name: "Ananya Rao",
      designation: "Senior Associate",
      department: "Litigation",
      officeLocation: "Floor 2, Cabin 4",
      email: ADMIN_EMAIL,
      phoneNumber: "+91-9800000001",
      isAdmin: true,
    },
    {
      employeeCode: "EMP-0002",
      name: "Vikram Mehta",
      designation: "Partner",
      department: "Corporate Law",
      officeLocation: "Floor 3, Cabin 1",
      email: "vikram.mehta@lawfirm.com",
      phoneNumber: "+91-9800000002",
      isAdmin: false,
    },
    {
      employeeCode: "EMP-0003",
      name: "Priya Nair",
      designation: "Associate",
      department: "Intellectual Property",
      officeLocation: "Floor 2, Cabin 7",
      email: "priya.nair@lawfirm.com",
      phoneNumber: "+91-9800000003",
      isAdmin: false,
    },
    {
      employeeCode: "EMP-0004",
      name: "Rohan Desai",
      designation: "Junior Associate",
      department: "Litigation",
      officeLocation: "Floor 2, Cabin 9",
      email: "rohan.desai@lawfirm.com",
      phoneNumber: "+91-9800000004",
      isAdmin: false,
    },
    {
      employeeCode: "EMP-0005",
      name: "Kavita Iyer",
      designation: "Paralegal",
      department: "Research",
      officeLocation: "Floor 1, Cabin 2",
      email: "kavita.iyer@lawfirm.com",
      phoneNumber: "+91-9800000005",
      isAdmin: false,
    },
  ];

  const employees: Record<string, string> = {};

  for (const seed of employeeSeeds) {
    const employee = await prisma.employee.upsert({
      where: { employeeCode: seed.employeeCode },
      update: {},
      create: {
        employeeCode: seed.employeeCode,
        name: seed.name,
        designation: seed.designation,
        department: seed.department,
        officeLocation: seed.officeLocation,
        email: seed.email,
        phoneNumber: seed.phoneNumber,
      },
    });
    employees[seed.employeeCode] = employee.id;

    if (seed.isAdmin) {
      await prisma.user.upsert({
        where: { email: seed.email },
        update: {},
        create: {
          email: seed.email,
          passwordHash: await hash(ADMIN_PASSWORD),
          role: "LIBRARY_ADMIN",
          employeeId: employee.id,
        },
      });
    }
  }
  console.log(`Seeded ${employeeSeeds.length} employees (1 with Library Admin login)`);

  // ------------------------------------------------------------
  // 3. Physical structure: Floor -> Rooms -> Shelves
  // ------------------------------------------------------------
  const floor = await prisma.floor.upsert({
    where: { name: "Floor 1" },
    update: {},
    create: { name: "Floor 1" },
  });

  const roomNames = ["Room A", "Room B", "Room C"];
  const shelfIdsByRoom: Record<string, string[]> = {};

  for (const roomName of roomNames) {
    const room = await prisma.room.upsert({
      where: { floorId_name: { floorId: floor.id, name: roomName } },
      update: {},
      create: { name: roomName, floorId: floor.id },
    });

    shelfIdsByRoom[roomName] = [];
    for (let i = 1; i <= 4; i++) {
      const shelfName = `Shelf S${i}`;
      const shelf = await prisma.shelf.upsert({
        where: { roomId_name: { roomId: room.id, name: shelfName } },
        update: {},
        create: { name: shelfName, roomId: room.id },
      });
      shelfIdsByRoom[roomName].push(shelf.id);
    }
  }
  console.log(`Seeded 1 floor, ${roomNames.length} rooms, ${roomNames.length * 4} shelves`);

  // ------------------------------------------------------------
  // 4. Catalog: Authors, Publishers, Categories
  // ------------------------------------------------------------
  const authorNames = [
    "M.P. Jain",
    "D.D. Basu",
    "Ratanlal & Dhirajlal",
    "Avtar Singh",
    "H.M. Seervai",
    "N.S. Bindra",
    "V.N. Shukla",
    "P.M. Bakshi",
  ];
  const publisherNames = [
    "Eastern Book Company",
    "LexisNexis",
    "Universal Law Publishing",
    "Thomson Reuters",
    "Wadhwa & Company",
  ];
  const categoryNames = [
    "Constitutional Law",
    "Criminal Law",
    "Corporate Law",
    "Contract Law",
    "Intellectual Property",
    "Family Law",
    "Tax Law",
    "Civil Procedure",
  ];

  const authorIds: Record<string, string> = {};
  for (const name of authorNames) {
    const author = await prisma.author.upsert({ where: { name }, update: {}, create: { name } });
    authorIds[name] = author.id;
  }

  const publisherIds: Record<string, string> = {};
  for (const name of publisherNames) {
    const publisher = await prisma.publisher.upsert({ where: { name }, update: {}, create: { name } });
    publisherIds[name] = publisher.id;
  }

  const categoryIds: Record<string, string> = {};
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    categoryIds[name] = category.id;
  }
  console.log(
    `Seeded ${authorNames.length} authors, ${publisherNames.length} publishers, ${categoryNames.length} categories`
  );

  // ------------------------------------------------------------
  // 5. Books - a representative sample across all book types
  // ------------------------------------------------------------
  const bookTypes = [
    "LAW_BOOK",
    "BARE_ACT",
    "CASE_LAW",
    "JOURNAL",
    "MANUAL",
    "COMMENTARY",
    "RESEARCH_PAPER",
    "REFERENCE_BOOK",
  ] as const;

  const bookTitles = [
    "Indian Constitutional Law",
    "The Code of Criminal Procedure",
    "Company Law: Principles and Practice",
    "Law of Contracts",
    "Intellectual Property Rights in India",
    "Hindu Law and Family Relations",
    "Income Tax Act: A Commentary",
    "Civil Procedure Code Explained",
    "Law of Evidence",
    "Arbitration and Conciliation Act",
    "Transfer of Property Act",
    "Negotiable Instruments Act",
    "Consumer Protection Law",
    "Environmental Law in India",
    "Labour and Industrial Law",
    "Banking Law and Practice",
    "Competition Law Commentary",
    "Cyber Law and Information Technology Act",
    "Law of Torts",
    "Administrative Law",
    "Human Rights Law",
    "International Trade Law",
    "Securities and Exchange Law",
    "Insolvency and Bankruptcy Code",
    "Real Estate Regulation Act",
    "Motor Vehicles Act Commentary",
    "Right to Information Act",
    "Juvenile Justice Act",
    "Prevention of Corruption Act",
    "GST Law and Procedure",
  ];

  let accessionCounter = 1;
  let createdCount = 0;

  for (let i = 0; i < bookTitles.length; i++) {
    const title = bookTitles[i];
    const author = authorNames[i % authorNames.length];
    const publisher = publisherNames[i % publisherNames.length];
    const category = categoryNames[i % categoryNames.length];
    const bookType = bookTypes[i % bookTypes.length];
    const roomName = roomNames[i % roomNames.length];
    const shelfId = shelfIdsByRoom[roomName][i % 4];

    const accessionNumber = `ACC-${String(accessionCounter).padStart(5, "0")}`;
    accessionCounter++;

    const existing = await prisma.book.findUnique({ where: { accessionNumber } });
    if (existing) continue;

    const location = await prisma.bookLocation.create({
      data: {
        shelfId,
        row: `Row ${(i % 5) + 1}`,
        position: `Position ${(i % 20) + 1}`,
      },
    });

    await prisma.book.create({
      data: {
        accessionNumber,
        isbn: `978-93-${String(1000 + i).padStart(4, "0")}-${i}`,
        barcodeNumber: `BC${String(100000 + i)}`,
        title,
        authorId: authorIds[author],
        publisherId: publisherIds[publisher],
        publicationYear: 2005 + (i % 20),
        edition: `${(i % 5) + 1} Edition`,
        categoryId: categoryIds[category],
        subject: category,
        language: "English",
        keywords: `${category.toLowerCase()}, ${bookType.toLowerCase().replace("_", " ")}`,
        bookType,
        numberOfPages: 200 + i * 15,
        condition: i % 7 === 0 ? "WORN" : "GOOD",
        status: "AVAILABLE",
        locationId: location.id,
        addedById: owner.id,
      },
    });
    createdCount++;
  }
  console.log(`Seeded ${createdCount} books`);

  // ------------------------------------------------------------
  // 6. A few sample borrow records (mix of issued and returned)
  // ------------------------------------------------------------
  const sampleBooks = await prisma.book.findMany({ take: 5, where: { status: "AVAILABLE" } });
  const employeeIdList = Object.values(employees);

  if (sampleBooks.length >= 2 && employeeIdList.length >= 2) {
    // One currently-issued book
    const issuedBook = sampleBooks[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await prisma.borrowRecord.create({
      data: {
        bookId: issuedBook.id,
        employeeId: employeeIdList[1],
        dueDate,
        status: "ISSUED",
        issuedById: owner.id,
      },
    });
    await prisma.book.update({ where: { id: issuedBook.id }, data: { status: "ISSUED" } });

    // One returned book (historical record)
    const returnedBook = sampleBooks[1];
    const pastIssueDate = new Date();
    pastIssueDate.setDate(pastIssueDate.getDate() - 30);
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 16);
    const pastReturnDate = new Date();
    pastReturnDate.setDate(pastReturnDate.getDate() - 18);

    await prisma.borrowRecord.create({
      data: {
        bookId: returnedBook.id,
        employeeId: employeeIdList[2] ?? employeeIdList[0],
        issueDate: pastIssueDate,
        dueDate: pastDueDate,
        returnDate: pastReturnDate,
        status: "RETURNED",
        issuedById: owner.id,
        returnedById: owner.id,
      },
    });

    console.log("Seeded 2 sample borrow records (1 issued, 1 returned)");
  }

  console.log("\nSeed complete.");
  console.log("----------------------------------------");
  console.log(`Website Owner login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log(`Library Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log("----------------------------------------");
  console.log("Change these passwords after first login.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

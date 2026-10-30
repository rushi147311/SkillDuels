const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Category = require("./models/Category");
const Question = require("./models/Question");

// correctAnswer is the zero-based index of the correct option.
const questionBank = [
  // GENERAL KNOWLEDGE
  ["General Knowledge", "Which is the largest ocean in the world?", ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"], 3, "Easy"],
  ["General Knowledge", "What is the national animal of India?", ["Asiatic Lion", "Indian Elephant", "Bengal Tiger", "Leopard"], 2, "Easy"],
  ["General Knowledge", "Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Mercury"], 1, "Easy"],
  ["General Knowledge", "Who is known as the Father of the Indian Constitution?", ["Mahatma Gandhi", "Jawaharlal Nehru", "Dr. B. R. Ambedkar", "Sardar Patel"], 2, "Easy"],
  ["General Knowledge", "What is the capital of India?", ["Mumbai", "New Delhi", "Kolkata", "Chennai"], 1, "Easy"],
  ["General Knowledge", "Which is the smallest continent by land area?", ["Europe", "Australia", "Antarctica", "South America"], 1, "Easy"],
  ["General Knowledge", "Which gas do plants absorb during photosynthesis?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 2, "Easy"],
  ["General Knowledge", "Who wrote the Indian national anthem?", ["Bankim Chandra Chatterjee", "Rabindranath Tagore", "Sarojini Naidu", "Subhas Chandra Bose"], 1, "Easy"],
  ["General Knowledge", "What is the currency of Japan?", ["Yuan", "Won", "Yen", "Ringgit"], 2, "Easy"],
  ["General Knowledge", "Which is the largest planet in our solar system?", ["Earth", "Saturn", "Jupiter", "Neptune"], 2, "Easy"],
  ["General Knowledge", "Which organ pumps blood through the human body?", ["Lungs", "Brain", "Liver", "Heart"], 3, "Easy"],
  ["General Knowledge", "The Taj Mahal is located in which city?", ["Delhi", "Agra", "Jaipur", "Lucknow"], 1, "Easy"],
  ["General Knowledge", "What is the chemical symbol for gold?", ["Ag", "Gd", "Au", "Go"], 2, "Easy"],
  ["General Knowledge", "What is the national flower of India?", ["Rose", "Lotus", "Sunflower", "Jasmine"], 1, "Easy"],
  ["General Knowledge", "Which planet is closest to the Sun?", ["Venus", "Earth", "Mercury", "Mars"], 2, "Easy"],
  ["General Knowledge", "Who was the first Prime Minister of India?", ["Sardar Patel", "Jawaharlal Nehru", "Rajendra Prasad", "Lal Bahadur Shastri"], 1, "Easy"],
  ["General Knowledge", "Which part of a plant absorbs water from the soil?", ["Leaves", "Stem", "Flowers", "Roots"], 3, "Easy"],
  ["General Knowledge", "What is the SI unit of force?", ["Joule", "Watt", "Newton", "Pascal"], 2, "Medium"],
  ["General Knowledge", "Alleppey is a well-known destination in which Indian state?", ["Tamil Nadu", "Kerala", "Karnataka", "Goa"], 1, "Easy"],
  ["General Knowledge", "Which is the largest animal on Earth?", ["African Elephant", "Blue Whale", "Giraffe", "Whale Shark"], 1, "Easy"],
  ["General Knowledge", "Which blood cells help the body fight infections?", ["Red blood cells", "Platelets", "White blood cells", "Plasma"], 2, "Medium"],
  ["General Knowledge", "What is the capital of Australia?", ["Sydney", "Melbourne", "Canberra", "Perth"], 2, "Easy"],
  ["General Knowledge", "Which instrument measures atmospheric pressure?", ["Thermometer", "Barometer", "Hygrometer", "Anemometer"], 1, "Medium"],
  ["General Knowledge", "Who discovered penicillin?", ["Louis Pasteur", "Alexander Fleming", "Edward Jenner", "Marie Curie"], 1, "Medium"],
  ["General Knowledge", "Which is the largest desert on Earth by area?", ["Sahara", "Gobi", "Arabian", "Antarctic Desert"], 3, "Medium"],
  ["General Knowledge", "How many sides does a hexagon have?", ["Five", "Six", "Seven", "Eight"], 1, "Easy"],
  ["General Knowledge", "Which festival is known as the Festival of Lights in India?", ["Holi", "Eid", "Diwali", "Pongal"], 2, "Easy"],
  ["General Knowledge", "What is the process of changing liquid water into water vapour called?", ["Condensation", "Freezing", "Evaporation", "Melting"], 2, "Easy"],
  ["General Knowledge", "The Statue of Liberty was gifted to the United States by which country?", ["United Kingdom", "France", "Italy", "Spain"], 1, "Medium"],
  ["General Knowledge", "What is the hardest naturally occurring substance?", ["Quartz", "Diamond", "Granite", "Topaz"], 1, "Easy"],
  ["General Knowledge", "What is the scientific study of earthquakes called?", ["Meteorology", "Seismology", "Geology", "Ecology"], 1, "Medium"],
  ["General Knowledge", "Which vitamin is produced in the skin with sunlight?", ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], 3, "Easy"],
  ["General Knowledge", "Which Indian city is called the Pink City?", ["Udaipur", "Jaipur", "Jodhpur", "Bhopal"], 1, "Easy"],
  ["General Knowledge", "What is the approximate speed of light in vacuum?", ["3 × 10^6 m/s", "3 × 10^8 m/s", "3 × 10^10 m/s", "3 × 10^5 m/s"], 1, "Medium"],
  ["General Knowledge", "Which layer lies directly beneath Earth's crust?", ["Outer core", "Inner core", "Mantle", "Atmosphere"], 2, "Medium"],
  ["General Knowledge", "Who formulated the three laws of motion?", ["Albert Einstein", "Isaac Newton", "Galileo Galilei", "Nikola Tesla"], 1, "Easy"],
  ["General Knowledge", "Which is the largest internal organ in the human body?", ["Heart", "Liver", "Kidney", "Lung"], 1, "Medium"],
  ["General Knowledge", "Which Indian state had the largest population in the 2011 Census?", ["Maharashtra", "Bihar", "Uttar Pradesh", "West Bengal"], 2, "Medium"],
  ["General Knowledge", "Which animal is the national aquatic animal of India?", ["Olive ridley turtle", "Ganges river dolphin", "Blue whale", "Crocodile"], 1, "Medium"],
  ["General Knowledge", "Which metal is liquid at ordinary room temperature?", ["Iron", "Mercury", "Aluminium", "Copper"], 1, "Easy"],
  ["General Knowledge", "What is the smallest prime number?", ["0", "1", "2", "3"], 2, "Easy"],
  ["General Knowledge", "On which date did India become a republic?", ["15 August 1947", "26 January 1950", "2 October 1950", "26 November 1949"], 1, "Easy"],
  ["General Knowledge", "Which instrument is used to observe distant celestial objects?", ["Microscope", "Telescope", "Periscope", "Binocular microscope"], 1, "Easy"],
  ["General Knowledge", "Which star is at the centre of our solar system?", ["Sirius", "Polaris", "The Sun", "Proxima Centauri"], 2, "Easy"],
  ["General Knowledge", "Which tree is the national tree of India?", ["Neem", "Banyan", "Peepal", "Mango"], 1, "Easy"],
  ["General Knowledge", "Bharatanatyam is a classical dance form associated with which state?", ["Kerala", "Odisha", "Tamil Nadu", "Assam"], 2, "Medium"],
  ["General Knowledge", "Which is the longest river in India by length within the country?", ["Yamuna", "Ganga", "Godavari", "Narmada"], 1, "Medium"],
  ["General Knowledge", "Which device is used to measure temperature?", ["Barometer", "Thermometer", "Ammeter", "Speedometer"], 1, "Easy"],
  ["General Knowledge", "How many players from one team are on the field in a standard football match?", ["9", "10", "11", "12"], 2, "Easy"],
  ["General Knowledge", "Which ocean lies along India's eastern coast?", ["Arabian Sea", "Bay of Bengal", "Red Sea", "Mediterranean Sea"], 1, "Easy"],

  // TECHNOLOGY
  ["Technology", "What is the main function of a CPU?", ["Store files permanently", "Execute instructions and process data", "Display web pages", "Connect to Wi-Fi"], 1, "Easy"],
  ["Technology", "Which type of memory is volatile?", ["ROM", "SSD", "RAM", "Hard disk"], 2, "Easy"],
  ["Technology", "What does HTML stand for?", ["HyperText Markup Language", "HighText Machine Language", "Hyperlink Text Management Language", "Home Tool Markup Language"], 0, "Easy"],
  ["Technology", "What does URL stand for?", ["Uniform Resource Locator", "Universal Record Link", "Unified Reference Language", "User Routing Location"], 0, "Easy"],
  ["Technology", "What does HTTPS add to HTTP?", ["Image compression", "Encrypted communication using TLS", "Faster CPU processing", "Offline browsing"], 1, "Medium"],
  ["Technology", "Which data structure follows LIFO?", ["Queue", "Stack", "Linked list", "Tree"], 1, "Easy"],
  ["Technology", "Which language is commonly used to query relational databases?", ["HTML", "SQL", "CSS", "XML"], 1, "Easy"],
  ["Technology", "Which tool is primarily used for version control?", ["Docker", "Git", "Jenkins", "Figma"], 1, "Easy"],
  ["Technology", "What is the default port for HTTP?", ["21", "25", "80", "443"], 2, "Medium"],
  ["Technology", "What is the default port for HTTPS?", ["53", "110", "143", "443"], 3, "Medium"],
  ["Technology", "What does DNS primarily do?", ["Encrypt files", "Translate domain names to IP addresses", "Compile source code", "Assign MAC addresses"], 1, "Medium"],
  ["Technology", "Node.js is primarily a runtime for which language?", ["Java", "Python", "JavaScript", "C#"], 2, "Easy"],
  ["Technology", "Java was originally developed at which company?", ["Microsoft", "Sun Microsystems", "IBM", "Apple"], 1, "Medium"],
  ["Technology", "Which JavaScript keyword declares a block-scoped variable that can be reassigned?", ["const", "let", "static", "define"], 1, "Easy"],
  ["Technology", "Which HTML element creates a hyperlink?", ["link", "a", "href", "url"], 1, "Easy"],
  ["Technology", "Which CSS property changes text color?", ["font-style", "background", "color", "text-decoration"], 2, "Easy"],
  ["Technology", "Which Git command creates a new local repository?", ["git push", "git clone", "git init", "git pull"], 2, "Easy"],
  ["Technology", "Which Git command downloads and integrates remote changes?", ["git status", "git pull", "git log", "git diff"], 1, "Medium"],
  ["Technology", "What is the purpose of a primary key in a relational table?", ["Allow duplicate rows", "Uniquely identify each row", "Encrypt each column", "Sort all records automatically"], 1, "Medium"],
  ["Technology", "MongoDB primarily stores records as which format?", ["CSV rows", "BSON documents", "XML pages", "Plain text files"], 1, "Medium"],
  ["Technology", "What does API stand for?", ["Application Programming Interface", "Advanced Program Installation", "Automated Process Internet", "Application Protocol Integration"], 0, "Easy"],
  ["Technology", "Which HTTP method is conventionally used to retrieve a resource?", ["POST", "PATCH", "GET", "DELETE"], 2, "Easy"],
  ["Technology", "What does HTTP status code 404 indicate?", ["Success", "Unauthorized", "Not Found", "Server ready"], 2, "Easy"],
  ["Technology", "What does HTTP status code 200 generally indicate?", ["Successful request", "Resource permanently moved", "Bad request", "Server error"], 0, "Easy"],
  ["Technology", "Which React hook is commonly used to manage component state?", ["useEffect", "useState", "useRef", "useMemo"], 1, "Easy"],
  ["Technology", "What does JSX allow developers to write?", ["SQL inside CSS", "HTML-like syntax in JavaScript", "Java inside HTML", "Binary inside JSON"], 1, "Medium"],
  ["Technology", "Which npm command installs dependencies listed in package.json?", ["npm start", "npm test", "npm install", "npm publish"], 2, "Easy"],
  ["Technology", "JSON data is primarily represented using which structures?", ["Functions and classes", "Objects and arrays", "Tables and rows only", "Pointers and queues"], 1, "Easy"],
  ["Technology", "Which of these is an open-source operating system kernel?", ["Linux", "Microsoft Word", "Oracle Database", "Google Chrome"], 0, "Easy"],
  ["Technology", "Which CPU scheduling algorithm gives processes a fixed time slice in rotation?", ["First Come First Served", "Shortest Job First", "Round Robin", "Priority only"], 2, "Medium"],
  ["Technology", "What is the decimal value of binary number 1010?", ["8", "9", "10", "12"], 2, "Easy"],
  ["Technology", "How many bits are there in one byte?", ["4", "8", "16", "32"], 1, "Easy"],
  ["Technology", "Which logical gate outputs 1 only when both inputs are 1?", ["OR", "XOR", "AND", "NOT"], 2, "Easy"],
  ["Technology", "What is the main role of a router?", ["Print documents", "Forward data packets between networks", "Compile programs", "Store passwords"], 1, "Easy"],
  ["Technology", "What does LAN stand for?", ["Large Access Node", "Local Area Network", "Linked Application Network", "Long Area Number"], 1, "Easy"],
  ["Technology", "Which protocol is commonly used to send email between mail servers?", ["FTP", "SMTP", "SSH", "DHCP"], 1, "Medium"],
  ["Technology", "Which protocol provides secure remote command-line access?", ["Telnet", "HTTP", "SSH", "POP3"], 2, "Medium"],
  ["Technology", "What is the primary role of an operating system?", ["Design web pages", "Manage hardware and software resources", "Create database schemas only", "Replace application software"], 1, "Easy"],
  ["Technology", "Google Drive is an example of which service?", ["Cloud storage", "Local compiler", "Database language", "Operating system"], 0, "Easy"],
  ["Technology", "What is an IDE?", ["Integrated Development Environment", "Internet Data Exchange", "Internal Device Engine", "Input Design Element"], 0, "Easy"],
  ["Technology", "What is the main purpose of unit testing?", ["Test individual units of code", "Measure internet speed", "Deploy an application", "Design user interfaces"], 0, "Medium"],
  ["Technology", "What is the time complexity of binary search on a sorted array?", ["O(n)", "O(log n)", "O(n²)", "O(1) in every case"], 1, "Medium"],
  ["Technology", "Supervised machine learning uses which kind of training data?", ["Unlabelled data only", "Labelled input-output examples", "No training data", "Only random numbers"], 1, "Medium"],
  ["Technology", "Which file extension is commonly used for Python source files?", [".java", ".py", ".js", ".html"], 1, "Easy"],
  ["Technology", "Which symbol begins a single-line comment in JavaScript?", ["#", "<!--", "//", "**"], 2, "Easy"],
  ["Technology", "What is the principle of least privilege?", ["Give every user administrator access", "Grant only the access needed for a task", "Share one password among users", "Disable all authentication"], 1, "Medium"],
  ["Technology", "Why are passwords hashed before storage?", ["To make them readable", "To store a one-way derived representation", "To send them as plain text", "To compress the database"], 1, "Medium"],
  ["Technology", "Which CSS layout system is designed primarily for one-dimensional layouts?", ["Flexbox", "SQL", "DOM", "Canvas"], 0, "Medium"],
  ["Technology", "Which command displays the current Git working-tree status?", ["git status", "git commit", "git merge", "git reset"], 0, "Easy"],
  ["Technology", "What does CRUD represent?", ["Create, Read, Update, Delete", "Copy, Run, Upload, Download", "Connect, Route, Use, Deploy", "Create, Render, Undo, Debug"], 0, "Medium"]
];

function normalize(text) {
  return String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing. Check server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  let inserted = 0;
  let skipped = 0;

  for (const categoryName of ["General Knowledge", "Technology"]) {
    let category = await Category.findOne({
      name: { $regex: `^${categoryName}$`, $options: "i" }
    });

    if (!category) {
      category = await Category.create({
        name: categoryName,
        description: `${categoryName} quiz questions`
      });
      console.log("Created category:", category.name);
    } else {
      console.log("Using existing category:", category.name);
    }

    const existing = await Question.find({ categoryName: category.name })
      .select("questionText")
      .lean();

    const existingTexts = new Set(
      existing.map(q => normalize(q.questionText))
    );

    for (const [cat, questionText, options, correctAnswer, difficulty] of questionBank) {
      if (normalize(cat) !== normalize(categoryName)) continue;

      const key = normalize(questionText);

      if (existingTexts.has(key)) {
        skipped++;
        continue;
      }

      if (options.length !== 4 || correctAnswer < 0 || correctAnswer > 3) {
        throw new Error(`Invalid question: ${questionText}`);
      }

      await Question.create({
        categoryName: category.name,
        category: category._id,
        questionText,
        options,
        correctAnswer,
        difficulty
      });

      existingTexts.add(key);
      inserted++;
    }

    const total = await Question.countDocuments({
      categoryName: category.name
    });

    console.log(`${category.name}: ${total} questions in database`);
  }

  console.log(`\nDone! Inserted: ${inserted}, skipped duplicates: ${skipped}`);
}

main()
  .catch(err => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });


import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesPattern = path
  .resolve(__dirname, "../routes/*.js")
  .replace(/\\/g, "/");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ExamPrep NG API",
      version: "1.0.0",
      description:
        "API documentation for the ExamPrep NG examination preparation platform.",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
apis: [ path.resolve(__dirname, "../routes/authRoute.js").replace(/\\/g, "/"),
     path.resolve(__dirname, "../routes/examRoutes.js").replace(/\\/g, "/"),
     path.resolve(__dirname, "../routes/topicRoutes.js").replace(/\\/g, "/"),
     path.resolve(__dirname, "../routes/attemptRoutes.js").replace(/\\/g, "/"),
     path.resolve(__dirname, "../routes/bookmarkRoutes.js").replace(/\\/g, "/"),
     path.resolve(__dirname, "../routes/dashboardRoute.js").replace(/\\/g, "/"),
     path.resolve(__dirname, "../routes/practiceRoutes.js").replace(/\\/g, "/"),
     path.resolve(__dirname, "../routes/onboardingRoutes.js").replace(/\\/g, "/"),
     path.resolve(__dirname, "../routes/practiceSessionRoutes.js").replace(/\\/g, "/"),
     path.resolve(__dirname, "../routes/settingsRoutes.js").replace(/\\/g, "/"),
     path.resolve(__dirname, "../routes/teacherRoutes.js").replace(/\\/g, "/"),
     path.resolve(__dirname, "../routes/subjectRoutes.js").replace(/\\/g, "/"),
      path.resolve(__dirname, "../routes/questionRoutes.js").replace(/\\/g, "/"),
      path.resolve(__dirname, "../routes/attemptRoutes.js").replace(/\\/g, "/"),



],
};

let swaggerSpec;

try {
  swaggerSpec = swaggerJsdoc(options);
} catch (error) {
  console.error("Swagger documentation error:", error.message);
  process.exit(1);
}

console.log("Swagger files pattern:", options.apis);
console.log("Swagger paths found:", Object.keys(swaggerSpec.paths || {}));

export default swaggerSpec;

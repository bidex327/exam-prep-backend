import swaggerJsdoc from "swagger-jsdoc";

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
      description: "Enter your JWT access token.",
    },
  },
},


},

apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Finanzas personales API",
            version: "1.0.0",
            description:
                "API de registro de ingresos y egresos para usuarios argentinos"
        }
    },
    apis: ["./src/infrastructure/swagger/docs/*.ts"]
};

export const swaggerSpec = swaggerJsdoc(options);

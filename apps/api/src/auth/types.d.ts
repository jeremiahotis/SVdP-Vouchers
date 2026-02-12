import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    authContext?: {
      actorId: string;
      tenantId: string;
      roles: string[];
    };
    partnerContext?: {
      tokenId: string;
      tenantId: string;
      partnerAgencyId: string;
    };
  }
}

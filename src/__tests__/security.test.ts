jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {},
}));

import { requireAuth, requireRole } from '@/lib/authorization';

const mockAuth = jest.mocked(require('@/lib/auth').auth);

describe('Security — Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('returns 401 when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await requireAuth();
      expect(result.error).toBeDefined();
      const response = result.error!;
      expect(response.status).toBe(401);
    });

    it('returns session when authenticated', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as any);
      const result = await requireAuth();
      expect(result.session).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });

  describe('requireRole', () => {
    it('returns 401 when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await requireRole(['ADMIN']);
      expect(result.error).toBeDefined();
      expect(result.error!.status).toBe(401);
    });

    it('returns 403 when role not allowed', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'EMPLOYEE' } } as any);
      const result = await requireRole(['ADMIN', 'HR']);
      expect(result.error).toBeDefined();
      expect(result.error!.status).toBe(403);
    });

    it('returns session when role is allowed', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as any);
      const result = await requireRole(['ADMIN', 'HR']);
      expect(result.session).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('rejects EMPLOYEE for ADMIN-only endpoint', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'EMPLOYEE' } } as any);
      const result = await requireRole(['ADMIN']);
      expect(result.error).toBeDefined();
      expect(result.error!.status).toBe(403);
    });

    it('rejects VIEWER for FINANCE endpoint', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'VIEWER' } } as any);
      const result = await requireRole(['ADMIN', 'FINANCE']);
      expect(result.error).toBeDefined();
      expect(result.error!.status).toBe(403);
    });

    it('accepts FINANCE for FINANCE endpoint', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'FINANCE' } } as any);
      const result = await requireRole(['ADMIN', 'FINANCE']);
      expect(result.session).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });
});

describe('Security — Auth Configuration', () => {
  it('auth.ts uses bcrypt for password hashing', () => {
    const authSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/lib/auth.ts'),
      'utf8'
    );
    expect(authSource).toContain('bcrypt');
  });

  it('auth.ts uses JWT session strategy', () => {
    const authSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/lib/auth.ts'),
      'utf8'
    );
    expect(authSource).toContain('strategy: "jwt"');
  });

  it('auth.ts requires credentials (email + password)', () => {
    const authSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/lib/auth.ts'),
      'utf8'
    );
    expect(authSource).toContain('email');
    expect(authSource).toContain('password');
  });

  it('auth.ts rejects empty credentials', () => {
    const authSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/lib/auth.ts'),
      'utf8'
    );
    expect(authSource).toContain('if (!credentials?.email || !credentials?.password) return null');
  });

  it('auth.ts checks isActive flag', () => {
    const authSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/lib/auth.ts'),
      'utf8'
    );
    expect(authSource).toContain('user.isActive');
  });

  it('auth.ts uses AUTH_SECRET from environment', () => {
    const authSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/lib/auth.ts'),
      'utf8'
    );
    expect(authSource).toContain('process.env.AUTH_SECRET');
  });
});

describe('Security — Seed Endpoint', () => {
  it('seed route checks NODE_ENV === development', () => {
    const seedSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/seed/route.ts'),
      'utf8'
    );
    expect(seedSource).toContain('process.env.NODE_ENV !== "development"');
  });

  it('seed route returns 403 when not development', () => {
    const seedSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/seed/route.ts'),
      'utf8'
    );
    expect(seedSource).toContain('status: 403');
  });

  it('seed route checks if database already seeded', () => {
    const seedSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/seed/route.ts'),
      'utf8'
    );
    expect(seedSource).toContain('Database already seeded');
  });
});

describe('Security — Environment', () => {
  it('.env is in .gitignore', () => {
    const gitignore = require('fs').readFileSync(
      require('path').join(process.cwd(), '.gitignore'),
      'utf8'
    );
    expect(gitignore).toContain('.env');
  });

  it('.env.backup is in .gitignore', () => {
    const gitignore = require('fs').readFileSync(
      require('path').join(process.cwd(), '.gitignore'),
      'utf8'
    );
    expect(gitignore).toContain('.env.backup');
  });

  it('.env.backup does not exist in project', () => {
    const fs = require('fs');
    const exists = fs.existsSync(
      require('path').join(process.cwd(), '.env.backup')
    );
    expect(exists).toBe(false);
  });
});

describe('Security — Middleware', () => {
  it('middleware protects non-public routes', () => {
    const middlewareSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/middleware.ts'),
      'utf8'
    );
    expect(middlewareSource).toContain('if (!req.auth)');
    expect(middlewareSource).toContain('redirect');
  });

  it('middleware allows /login as public', () => {
    const middlewareSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/middleware.ts'),
      'utf8'
    );
    expect(middlewareSource).toContain('"/login"');
  });

  it('middleware allows /api/auth as public', () => {
    const middlewareSource = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/middleware.ts'),
      'utf8'
    );
    expect(middlewareSource).toContain('"/api/auth"');
  });
});

describe('Security — API Company Isolation', () => {
  it('employees GET filters by companyId', () => {
    const source = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/employees/route.ts'),
      'utf8'
    );
    expect(source).toContain('companyId');
    expect(source).toContain('{ companyId }');
  });

  it('employees [id] GET checks companyId', () => {
    const source = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/employees/[id]/route.ts'),
      'utf8'
    );
    expect(source).toContain('companyId');
    expect(source).toContain('where: { id, companyId }');
  });

  it('payments GET filters by company', () => {
    const source = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/payments/route.ts'),
      'utf8'
    );
    expect(source).toContain('companyId');
  });

  it('leave GET requires role', () => {
    const source = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/leave/route.ts'),
      'utf8'
    );
    expect(source).toContain('requireRole');
  });

  it('services [id] PUT requires role', () => {
    const source = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/services/[id]/route.ts'),
      'utf8'
    );
    expect(source).toContain('requireRole');
  });

  it('clients [id] PUT requires role', () => {
    const source = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/clients/[id]/route.ts'),
      'utf8'
    );
    expect(source).toContain('requireRole');
  });

  it('audit route requires ADMIN role', () => {
    const source = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/audit/route.ts'),
      'utf8'
    );
    expect(source).toContain('requireRole(["ADMIN"])');
  });

  it('admin audit-log requires ADMIN role', () => {
    const source = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/admin/audit-log/route.ts'),
      'utf8'
    );
    expect(source).toContain('requireRole(["ADMIN"])');
  });

  it('payroll records PUT requires role', () => {
    const source = require('fs').readFileSync(
      require('path').join(process.cwd(), 'src/app/api/payroll/records/[id]/route.ts'),
      'utf8'
    );
    expect(source).toContain('requireRole');
  });
});

describe('Security — Headers Configuration', () => {
  it('next.config.ts sets X-Frame-Options', () => {
    const config = require('fs').readFileSync(
      require('path').join(process.cwd(), 'next.config.ts'),
      'utf8'
    );
    expect(config).toContain('X-Frame-Options');
    expect(config).toContain('DENY');
  });

  it('next.config.ts sets X-Content-Type-Options', () => {
    const config = require('fs').readFileSync(
      require('path').join(process.cwd(), 'next.config.ts'),
      'utf8'
    );
    expect(config).toContain('X-Content-Type-Options');
    expect(config).toContain('nosniff');
  });

  it('next.config.ts sets Referrer-Policy', () => {
    const config = require('fs').readFileSync(
      require('path').join(process.cwd(), 'next.config.ts'),
      'utf8'
    );
    expect(config).toContain('Referrer-Policy');
  });

  it('next.config.ts sets Permissions-Policy', () => {
    const config = require('fs').readFileSync(
      require('path').join(process.cwd(), 'next.config.ts'),
      'utf8'
    );
    expect(config).toContain('Permissions-Policy');
  });
});

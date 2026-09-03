-- ============================================
-- MIGRACIÓN: Sistema de Cobros y Pagos
-- Fecha: 2026-09-03
-- ============================================

BEGIN;

-- ============================================
-- 1. TABLA DE ENTIDADES (empresas, ONGs, convenios)
-- ============================================
CREATE TABLE IF NOT EXISTS entidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'empresa', -- empresa, ong, gobierno
  identificador VARCHAR(100) UNIQUE, -- NIT o código único
  contacto_nombre VARCHAR(100),
  contacto_email VARCHAR(100),
  contacto_telefono VARCHAR(50),
  descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
  bolsa_horas_inicial INTEGER DEFAULT 0,
  bolsa_horas_restantes INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() AT TIME ZONE 'America/Bogota',
  updated_at TIMESTAMP DEFAULT NOW() AT TIME ZONE 'America/Bogota'
);

-- ============================================
-- 2. TABLA DE CUPONES
-- ============================================
CREATE TABLE IF NOT EXISTS cupones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(20) NOT NULL, -- porcentaje, fijo, gratis, bolsa_horas
  valor DECIMAL(10,2) NOT NULL, -- 50 = 50%, 50000 = $50,000, 0 = gratis
  entidad_id UUID REFERENCES entidades(id) ON DELETE SET NULL,
  aplica_a VARCHAR(20) DEFAULT 'todos', -- nuevos, antiguos, todos
  fecha_inicio TIMESTAMP,
  fecha_expiracion TIMESTAMP,
  usos_maximos INTEGER DEFAULT 1,
  usos_actuales INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() AT TIME ZONE 'America/Bogota',
  updated_at TIMESTAMP DEFAULT NOW() AT TIME ZONE 'America/Bogota'
);

-- ============================================
-- 3. TABLA DE COBROS
-- ============================================
CREATE TABLE IF NOT EXISTS cobros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  guia_id UUID NOT NULL REFERENCES usuarios(id),
  entidad_id UUID REFERENCES entidades(id) ON DELETE SET NULL,
  duracion_minutos INTEGER NOT NULL DEFAULT 60,
  costo_por_hora DECIMAL(10,2) NOT NULL DEFAULT 100000,
  descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
  descuento_aplicado DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagado, fallido, exento, consumido_bolsa
  metodo_pago VARCHAR(50), -- mercadopago, epay, transferencia, efectivo, bolsa_horas
  comprobante_url VARCHAR(500),
  preferencia_id VARCHAR(100), -- ID de MercadoPago/ePay
  pagado_at TIMESTAMP,
  creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() AT TIME ZONE 'America/Bogota',
  updated_at TIMESTAMP DEFAULT NOW() AT TIME ZONE 'America/Bogota'
);

-- ============================================
-- 4. TABLA DE CONSUMO DE BOLSA DE HORAS
-- ============================================
CREATE TABLE IF NOT EXISTS consumo_bolsa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
  turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  horas_consumidas DECIMAL(5,2) NOT NULL,
  fecha_consumo TIMESTAMP DEFAULT NOW() AT TIME ZONE 'America/Bogota',
  created_at TIMESTAMP DEFAULT NOW() AT TIME ZONE 'America/Bogota'
);

-- ============================================
-- 5. CAMPOS NUEVOS EN TABLA USUARIOS
-- ============================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS entidad_id UUID REFERENCES entidades(id) ON DELETE SET NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_exento BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS motivo_exencion TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS descuento_personalizado DECIMAL(5,2) DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_nuevo BOOLEAN DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP DEFAULT NOW() AT TIME ZONE 'America/Bogota';

-- ============================================
-- 6. NUEVO ESTADO PARA TURNOS (pendiente_pago)
-- ============================================
-- Agregar el nuevo estado a la restricción CHECK de la tabla turnos
-- Primero verificamos si existe la restricción
DO $$
BEGIN
    -- Eliminar la restricción existente si existe
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'turnos_estado_check' 
        AND conrelid = 'turnos'::regclass
    ) THEN
        ALTER TABLE turnos DROP CONSTRAINT turnos_estado_check;
    END IF;
    
    -- Crear la nueva restricción con el nuevo estado
    ALTER TABLE turnos ADD CONSTRAINT turnos_estado_check 
        CHECK (estado IN ('pendiente', 'pendiente_pago', 'aceptado', 'iniciado', 'completado', 'cancelado'));
END $$;

-- ============================================
-- 7. ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cobros_turno_id ON cobros(turno_id);
CREATE INDEX IF NOT EXISTS idx_cobros_usuario_id ON cobros(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cobros_estado ON cobros(estado);
CREATE INDEX IF NOT EXISTS idx_cobros_preferencia_id ON cobros(preferencia_id);
CREATE INDEX IF NOT EXISTS idx_cobros_created_at ON cobros(created_at);
CREATE INDEX IF NOT EXISTS idx_consumo_bolsa_entidad_id ON consumo_bolsa(entidad_id);
CREATE INDEX IF NOT EXISTS idx_consumo_bolsa_turno_id ON consumo_bolsa(turno_id);
CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones(codigo);
CREATE INDEX IF NOT EXISTS idx_cupones_activo ON cupones(activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_entidad_id ON usuarios(entidad_id);

COMMIT;
import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as adminUsuariosController from '../controllers/adminUsuariosController';

const router = Router();

// Todas las rutas requieren autenticación y rol admin
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// USUARIOS
// ============================================

// Obtener todos los usuarios
router.get('/', adminUsuariosController.getUsuarios);

// Obtener usuario por ID
router.get('/:id', adminUsuariosController.getUsuarioById);

// Crear usuario (admin)
router.post('/', adminUsuariosController.crearUsuario);

// Actualizar usuario
router.put('/:id', adminUsuariosController.actualizarUsuario);

// Cambiar rol de usuario
router.patch('/:id/rol', adminUsuariosController.actualizarRol);

// Eliminar usuario
router.delete('/:id', adminUsuariosController.eliminarUsuario);

export default router;
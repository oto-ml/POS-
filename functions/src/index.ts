import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function para eliminar un usuario de Firebase Auth
 * 
 * Solo permite que admins eliminen usuarios.
 * Valida que el usuario tenga permiso y que el UID sea válido.
 */
export const deleteUser = functions.https.onCall(async (data, context) => {
  // Verificar que el usuario esté autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'El usuario debe estar autenticado para ejecutar esta operación.'
    );
  }

  const uid = data.uid;

  // Validar que se proporcionó un UID
  if (!uid || typeof uid !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Debes proporcionar un UID válido.'
    );
  }

  // Prevenir que un usuario se elimine a sí mismo
  if (uid === context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'No puedes eliminar tu propia cuenta.'
    );
  }

  try {
    // Verificar que el usuario actual es admin
    const adminUser = await admin.auth().getUser(context.auth.uid);
    
    // Verificar que tiene claim de admin (opcional pero recomendado)
    const customClaims = adminUser.customClaims as any;
    if (!customClaims?.admin) {
      // Fallback: verificar en Firestore
      const adminUserDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
      const adminUserData = adminUserDoc.data() as any;
      
      if (adminUserData?.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Solo los administradores pueden eliminar usuarios.'
        );
      }
    }

    // Eliminar el usuario de Firebase Auth
    await admin.auth().deleteUser(uid);

    // Registrar la acción en Firestore
    await admin.firestore().collection('audit_logs').add({
      action: 'delete_user_from_auth',
      deletedUserId: uid,
      deletedByUID: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: 'Usuario eliminado de Firebase Auth por admin'
    });

    console.log(`Usuario ${uid} eliminado de Auth por ${context.auth.uid}`);

    return {
      success: true,
      message: `Usuario ${uid} eliminado correctamente de Firebase Auth`,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Error eliminando usuario:', error);

    // Manejo específico de errores
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError(
        'not-found',
        'El usuario que intentas eliminar no existe.'
      );
    }

    // Error genérico
    throw new functions.https.HttpsError(
      'internal',
      `Error al eliminar usuario: ${error.message}`
    );
  }
});

/**
 * Cloud Function para obtener información de un usuario
 * Útil para verificar permisos
 */
export const getUserInfo = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'El usuario debe estar autenticado.'
    );
  }

  try {
    const uid = data.uid || context.auth.uid;
    
    // Solo permitir que vean su propia info o que sean admins
    if (uid !== context.auth.uid) {
      const currentUserDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
      const currentUserData = currentUserDoc.data() as any;
      
      if (currentUserData?.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'No tienes permiso para ver información de otros usuarios.'
        );
      }
    }

    const userRecord = await admin.auth().getUser(uid);
    const userDoc = await admin.firestore().collection('users').doc(uid).get();

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      role: (userDoc.data() as any)?.role || 'unknown',
      createdAt: userRecord.metadata.creationTime,
      lastSignIn: userRecord.metadata.lastSignInTime
    };
  } catch (error: any) {
    console.error('Error obteniendo información del usuario:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Error: ${error.message}`
    );
  }
});

/**
 * Utilidad para eliminar usuarios de Firebase Auth
 * 
 * Este archivo proporciona una forma segura de eliminar cuentas de usuarios.
 * Para que funcione automáticamente, necesitas configurar una Cloud Function
 * en Firebase que maneje la eliminación en el lado del servidor.
 */

import { httpsCallable, getFunctions } from 'firebase/functions';

/**
 * Intenta eliminar un usuario de Firebase Auth usando una Cloud Function
 * @param uid - El UID del usuario a eliminar
 * @returns Promise<boolean> - true si se eliminó correctamente, false si falló
 */
export const deleteUserFromAuth = async (uid: string): Promise<boolean> => {
  try {
    const functions = getFunctions();
    const deleteUserFunction = httpsCallable(functions, 'deleteUser');
    
    const result = await deleteUserFunction({ uid });
    console.log("Usuario eliminado de Auth:", result);
    return true;
  } catch (error: any) {
    console.warn("No se pudo eliminar usuario de Auth:", error);
    return false;
  }
};

/**
 * Proporciona instrucciones al admin para eliminar manualmente un usuario
 * @param userEmail - El email del usuario a eliminar
 * @returns string - Instrucciones detalladas
 */
export const getManualDeleteInstructions = (userEmail: string): string => {
  return `Para reutilizar el email "${userEmail}" en el futuro, sigue estos pasos:

1. Accede a Firebase Console:
   https://console.firebase.google.com/

2. Selecciona tu proyecto POS

3. Ve a Authentication (Autenticación) en el menú izquierdo

4. Haz clic en la pestaña "Users" (Usuarios)

5. Busca el usuario con email: ${userEmail}

6. Haz clic en los tres puntos (...) y selecciona "Delete user" (Eliminar usuario)

7. Confirma la eliminación

Después de esto, podrás crear un nuevo usuario con ese mismo email.`;
};

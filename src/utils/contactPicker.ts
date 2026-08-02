/**
 * Utility for accessing Web Contact Picker API (where supported)
 * and managing permission explanation dialog state.
 */

export interface PickedContactResult {
  name: string;
  phone: string;
  relationship?: string;
}

export function isContactPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;
}

export async function requestDeviceContact(): Promise<{
  success: boolean;
  contact?: PickedContactResult;
  error?: 'unsupported' | 'denied' | 'canceled' | 'unknown';
  message?: string;
}> {
  if (!isContactPickerSupported()) {
    return {
      success: false,
      error: 'unsupported',
      message: 'Native Contact Picker is not available on this browser/device.',
    };
  }

  try {
    const props = ['name', 'tel'];
    const opts = { multiple: false };
    
    // Call native Web Contact Picker API
    const contacts = await (navigator as any).contacts.select(props, opts);
    
    if (contacts && contacts.length > 0) {
      const selected = contacts[0];
      const rawName = selected.name && selected.name.length > 0 ? selected.name[0] : '';
      const rawTel = selected.tel && selected.tel.length > 0 ? selected.tel[0] : '';
      
      if (!rawName && !rawTel) {
        return {
          success: false,
          error: 'canceled',
          message: 'No contact information was provided.',
        };
      }

      return {
        success: true,
        contact: {
          name: rawName || 'Emergency Contact',
          phone: rawTel,
        },
      };
    } else {
      return {
        success: false,
        error: 'canceled',
        message: 'No contact was selected.',
      };
    }
  } catch (err: any) {
    console.warn('Contact picker error:', err);
    if (err?.name === 'SecurityError' || err?.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'denied',
        message: 'Contact access permission was denied or restricted.',
      };
    }
    return {
      success: false,
      error: 'unknown',
      message: err?.message || 'Failed to access device contacts.',
    };
  }
}

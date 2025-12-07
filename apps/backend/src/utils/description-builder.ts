/**
 * Utility for building descriptive activity tracking messages from change metadata
 */

export interface ChangeMetadata {
  changedFields: string[];
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
}

export interface DescriptionBuilderOptions {
  entityName: string; // e.g., "inventory item", "admin", "supplier"
  entityDisplayName: string; // e.g., "Panadol", "John Doe"
  changes: ChangeMetadata;
  fieldMappings?: Record<string, string>; // Map field names to friendly labels
  specialHandlers?: {
    image?: boolean; // Handle image field specially
    password?: boolean; // Handle password field specially (don't show values)
    arrays?: string[]; // Fields that are arrays (e.g., ["roles"])
  };
}

/**
 * Get friendly field name
 */
function getFieldLabel(
  field: string,
  fieldMappings?: Record<string, string>
): string {
  if (fieldMappings && fieldMappings[field]) {
    return fieldMappings[field];
  }
  // Default: capitalize first letter
  return field.charAt(0).toUpperCase() + field.slice(1);
}

/**
 * Format value for display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "object") {
    // For objects, return a simple representation
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    // For image objects, try to get a meaningful representation
    if (value.url || value.mediaId) {
      return "Image";
    }
    return "[object]";
  }
  if (typeof value === "string" && value.length > 50) {
    return `"${value.substring(0, 50)}..."`;
  }
  return `"${value}"`;
}

/**
 * Check if image was added, updated, or removed
 */
function getImageChangeType(
  oldValue: any,
  newValue: any
): "added" | "updated" | "removed" | null {
  const oldIsNull = oldValue === null || oldValue === undefined;
  const newIsNull = newValue === null || newValue === undefined;

  if (oldIsNull && !newIsNull) return "added";
  if (!oldIsNull && newIsNull) return "removed";
  if (!oldIsNull && !newIsNull) {
    // Check if it's actually different
    const oldId = oldValue?.mediaId || oldValue?._id || oldValue;
    const newId = newValue?.mediaId || newValue?._id || newValue;
    if (oldId !== newId) return "updated";
  }
  return null;
}

/**
 * Build description for a single field change
 */
function buildSingleFieldDescription(
  field: string,
  oldValue: any,
  newValue: any,
  options: DescriptionBuilderOptions
): string {
  const fieldLabel = getFieldLabel(field, options.fieldMappings);
  const entityName = options.entityName;
  const entityDisplayName = options.entityDisplayName;

  // Special handling for image field
  if (options.specialHandlers?.image && field === "image") {
    const changeType = getImageChangeType(oldValue, newValue);
    if (changeType === "added") {
      return `Added an Image to ${entityName} "${entityDisplayName}"`;
    }
    if (changeType === "removed") {
      return `Removed Image from ${entityName} "${entityDisplayName}"`;
    }
    if (changeType === "updated") {
      return `Updated Image of ${entityName} "${entityDisplayName}"`;
    }
  }

  // Special handling for password field (don't show values)
  if (options.specialHandlers?.password && field === "password") {
    return `Updated password for ${entityName} "${entityDisplayName}"`;
  }

  // Special handling for array fields
  if (
    options.specialHandlers?.arrays &&
    options.specialHandlers.arrays.includes(field)
  ) {
    return `Updated ${fieldLabel} of ${entityName} "${entityDisplayName}"`;
  }

  // Default: show old and new values
  const oldFormatted = formatValue(oldValue);
  const newFormatted = formatValue(newValue);
  return `Updated ${fieldLabel.toLowerCase()} of ${entityName} from ${oldFormatted} to ${newFormatted}`;
}

/**
 * Build activity description from change metadata
 */
export function buildUpdateDescription(
  options: DescriptionBuilderOptions
): string {
  const { changes, entityName, entityDisplayName } = options;
  const { changedFields, oldValues, newValues } = changes;

  if (changedFields.length === 0) {
    return `Updated ${entityName} "${entityDisplayName}"`;
  }

  if (changedFields.length === 1) {
    const field = changedFields[0];
    const oldValue = oldValues[field];
    const newValue = newValues[field];
    return buildSingleFieldDescription(field, oldValue, newValue, options);
  }

  // Multiple fields changed - build summary
  const fieldLabels = changedFields.map((field) =>
    getFieldLabel(field, options.fieldMappings).toLowerCase()
  );

  // Format list: "name, category, and Image"
  let fieldsText = "";
  if (fieldLabels.length === 2) {
    fieldsText = fieldLabels.join(" and ");
  } else {
    const lastField = fieldLabels.pop();
    fieldsText = `${fieldLabels.join(", ")}, and ${lastField}`;
  }

  return `Updated ${fieldsText} of ${entityName} "${entityDisplayName}"`;
}

/**
 * Extract and remove _changes from request body
 */
export function extractChangesMetadata(body: any): {
  changes: ChangeMetadata | null;
  cleanBody: any;
} {
  const { _changes, ...cleanBody } = body;

  if (!_changes || typeof _changes !== "object") {
    return { changes: null, cleanBody };
  }

  const changes: ChangeMetadata = {
    changedFields: Array.isArray(_changes.changedFields)
      ? _changes.changedFields
      : [],
    oldValues: _changes.oldValues || {},
    newValues: _changes.newValues || {},
  };

  return { changes, cleanBody };
}

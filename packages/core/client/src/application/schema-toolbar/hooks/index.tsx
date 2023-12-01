import React, { useMemo } from 'react';
import { ISchema } from '@formily/json-schema';
import { useComponent, useDesignable } from '../../../schema-component';
import { SchemaToolbar } from '../../../schema-settings';

export const useSchemaToolbarRender = (fieldSchema: ISchema) => {
  const { designable } = useDesignable();
  const toolbar = useMemo(() => {
    if (fieldSchema['x-designer'] || fieldSchema['x-toolbar']) {
      return fieldSchema['x-toolbar'];
    }

    if (fieldSchema['x-initializer'] || fieldSchema['x-settings']) {
      return SchemaToolbar;
    }
  }, [fieldSchema]);

  const C = useComponent(toolbar);
  return {
    render(props?: any) {
      if (!designable || !C) {
        return null;
      }
      return <C {...fieldSchema['x-toolbar-props']} {...props} />;
    },
    exists: !!C,
  };
};

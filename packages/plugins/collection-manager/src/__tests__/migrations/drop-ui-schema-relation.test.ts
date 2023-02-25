import { MockServer } from '@nocobase/test';
import { Plugin } from '@nocobase/server';
import { Database, MigrationContext } from '@nocobase/database';
import { createApp } from '../index';
import Migrator from '../../migrations/20230225111111-drop-ui-schema-relation';

class AddBelongsToPlugin extends Plugin {
  beforeLoad() {
    this.app.db.on('beforeDefineCollection', (options) => {
      if (options.name == 'fields') {
        options.fields.push({
          type: 'belongsTo',
          name: 'uiSchema',
          target: 'uiSchemas',
          foreignKey: 'uiSchemaUid',
        });
      }
    });
  }
}

describe('drop ui schema', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createApp({
      beforePlugin(app) {
        app.plugin(AddBelongsToPlugin, { name: 'test' });
      },
    });

    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should update uiSchema to options field', async () => {
    const schemaContent = {
      title: '{{t("Collection display name")}}',
      type: 'number',
      'x-component': 'Input',
      required: true,
    };

    await db.getRepository('collections').create({
      values: {
        name: 'testCollection',
        fields: [
          {
            name: 'testField',
            type: 'string',
            uiSchema: {
              title: '{{t("Collection display name")}}',
              type: 'number',
              'x-component': 'Input',
              required: true,
            },
          },
          {
            name: 'fieldWithoutSchema',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const testFieldRecord = await db.getRepository('fields').findOne({
      filter: {
        name: 'testField',
      },
    });

    expect(testFieldRecord.rawAttributes['uiSchemaUid']).toBeTruthy();

    const options = testFieldRecord.get('options');
    expect(options.uiSchema).toBeFalsy();

    // remove uiSchema field
    const fieldCollection = db.getCollection('fields');
    fieldCollection.removeField('uiSchema');
    await fieldCollection.sync();

    const testFieldRecord1 = await db.getRepository('fields').findOne({
      filter: {
        name: 'testField',
      },
    });

    expect(testFieldRecord1.rawAttributes['uiSchemaUid']).toBeFalsy();
    expect(testFieldRecord1.get('options').uiSchema).toBeFalsy();

    // do migrate
    const migration = new Migrator({ db } as MigrationContext);
    migration.context.app = app;
    await migration.up();

    const testFieldRecord2 = await db.getRepository('fields').findOne({
      filter: {
        name: 'testField',
      },
    });

    expect(testFieldRecord2.rawAttributes['uiSchemaUid']).toBeFalsy();
    expect(testFieldRecord2.get('options').uiSchema).toMatchObject(schemaContent);
  });
});

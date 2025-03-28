'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Remove existing indexes
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS users_email_active_key');
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS users_name_active_key');
    } catch (error) {
      console.log('No existing indexes to remove');
    }

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_login_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      status: {
        type: Sequelize.ENUM('active', 'blocked'),
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    });

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX users_email_key 
      ON users (LOWER(email));
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX users_name_key 
      ON users (LOWER(name));
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS users_name_lower_idx ON users (LOWER(name));
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS users_email_key');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS users_name_key');
    await queryInterface.dropTable('users');
  }
};
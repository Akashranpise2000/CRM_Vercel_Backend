const Contact = require('../models/Contact');
const Company = require('../models/Company');

/**
 * Link a contact to a company (two-way relationship)
 * @param {string} contactId - Contact ID
 * @param {string} companyId - Company ID
 * @param {string} userId - User ID for authorization
 */
const linkContactToCompany = async (contactId, companyId, userId) => {
  // Verify both exist and belong to user
  const [contact, company] = await Promise.all([
    Contact.findOne({ _id: contactId, createdBy: userId }),
    Company.findOne({ _id: companyId, createdBy: userId })
  ]);

  if (!contact) throw new Error('Contact not found');
  if (!company) throw new Error('Company not found');

  // Update contact's company_id
  contact.company_id = companyId;
  await contact.save();

  // Add contact to company's contacts array if not already present
  if (!company.contacts.includes(contactId)) {
    company.contacts.push(contactId);
    await company.save();
  }

  return { contact, company };
};

/**
 * Unlink a contact from a company (two-way relationship)
 * @param {string} contactId - Contact ID
 * @param {string} companyId - Company ID
 * @param {string} userId - User ID for authorization
 */
const unlinkContactFromCompany = async (contactId, companyId, userId) => {
  // Verify both exist and belong to user
  const [contact, company] = await Promise.all([
    Contact.findOne({ _id: contactId, createdBy: userId }),
    Company.findOne({ _id: companyId, createdBy: userId })
  ]);

  if (!contact) throw new Error('Contact not found');
  if (!company) throw new Error('Company not found');

  // Remove company_id from contact
  contact.company_id = null;
  await contact.save();

  // Remove contact from company's contacts array
  company.contacts = company.contacts.filter(id => id.toString() !== contactId);
  await company.save();

  return { contact, company };
};

/**
 * Update all contacts for a company (replace entire contacts array)
 * @param {string} companyId - Company ID
 * @param {string[]} contactIds - Array of contact IDs
 * @param {string} userId - User ID for authorization
 */
const updateCompanyContacts = async (companyId, contactIds, userId) => {
  // Verify company exists and belongs to user
  const company = await Company.findOne({ _id: companyId, createdBy: userId });
  if (!company) throw new Error('Company not found');

  // Verify all contacts exist and belong to user
  const contacts = await Contact.find({
    _id: { $in: contactIds },
    createdBy: userId
  });

  if (contacts.length !== contactIds.length) {
    throw new Error('One or more contacts not found');
  }

  // Get previous contacts to update their company_id
  const previousContactIds = company.contacts.map(id => id.toString());

  // Update company's contacts array
  company.contacts = contactIds;
  await company.save();

  // Update company_id for new contacts
  await Contact.updateMany(
    { _id: { $in: contactIds }, createdBy: userId },
    { company_id: companyId }
  );

  // Remove company_id from contacts that are no longer associated
  const removedContactIds = previousContactIds.filter(id => !contactIds.includes(id));
  if (removedContactIds.length > 0) {
    await Contact.updateMany(
      { _id: { $in: removedContactIds }, createdBy: userId },
      { $unset: { company_id: 1 } }
    );
  }

  return company;
};

/**
 * Update contact's company (handles unlinking from old company and linking to new)
 * @param {string} contactId - Contact ID
 * @param {string} companyId - New company ID (null to unlink)
 * @param {string} userId - User ID for authorization
 */
const updateContactCompany = async (contactId, companyId, userId) => {
  // Verify contact exists and belongs to user
  const contact = await Contact.findOne({ _id: contactId, createdBy: userId });
  if (!contact) throw new Error('Contact not found');

  const oldCompanyId = contact.company_id;

  // If unlinking (companyId is null)
  if (!companyId) {
    if (oldCompanyId) {
      return await unlinkContactFromCompany(contactId, oldCompanyId, userId);
    }
    return { contact, company: null };
  }

  // Verify new company exists and belongs to user
  const company = await Company.findOne({ _id: companyId, createdBy: userId });
  if (!company) throw new Error('Company not found');

  // Unlink from old company if different
  if (oldCompanyId && oldCompanyId.toString() !== companyId) {
    await unlinkContactFromCompany(contactId, oldCompanyId, userId);
  }

  // Link to new company
  return await linkContactToCompany(contactId, companyId, userId);
};

module.exports = {
  linkContactToCompany,
  unlinkContactFromCompany,
  updateCompanyContacts,
  updateContactCompany
};
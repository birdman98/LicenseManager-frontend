import React, { Fragment, useEffect, useState } from 'react';
import moment from 'moment';
import axios from '../../../common/axios';

import { EuiBadge, EuiButton, EuiHealth, EuiInMemoryTable } from '@elastic/eui';

import {
  createDangerToast,
  createSuccessToast,
} from '../../../common/toastsUtils';

import DetailsModal from '../../modals/detailsModal';
import LicenseDetailsForm from '../../forms/licenseDetailsForm';
import ConfirmModal from '../../modals/confirmModal';
import LicenseExpirationForm from '../../forms/licenseExpirationForm';

function LicensesManagementTab() {
  const [licensesList, setLicensesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [licenseCustomersList, setLicenseCustomersList] = useState([]);
  const [licenseTemplatesList, setLicenseTemplatesList] = useState([]);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [licenseDetails, setLicenseDetails] = useState({});
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [licenseToExtend, setLicenseToExtend] = useState({});
  const [newExpirationDate, setNewExpirationDate] = useState({});

  useEffect(() => {
    getLicensesList();
  }, []);

  const getLicensesList = () => {
    setIsLoading(true);
    axios
      .get('/api/licenses/list')
      .then(({ data }) => {
        if (data.length) {
          setLicensesList(data);
          const customersList = getLicenseCustomersList(data);
          setLicenseCustomersList(customersList);
          const templatesList = getLicenseTemplatesList(data);
          setLicenseTemplatesList(templatesList);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        createDangerToast('Error', error);
        setIsLoading(false);
      });
  };

  const getLicenseCustomersList = (licensesList) => {
    const customers = licensesList.map(({ customer: { id, name } }) => ({
      id,
      name,
      value: name,
    }));
    const uniqueCustomers = [];
    customers.forEach((customer) => {
      if (!uniqueCustomers.some(({ id }) => id === customer.id)) {
        uniqueCustomers.push(customer);
      }
    });

    return uniqueCustomers;
  };

  const getLicenseTemplatesList = (licensesList) => {
    const templates = licensesList.map(({ usedTemplate: { id, name } }) => ({
      id,
      name,
      value: name,
    }));
    const uniqueTemplates = [];
    templates.forEach((template) => {
      if (!uniqueTemplates.some(({ id }) => id === template.id)) {
        uniqueTemplates.push(template);
      }
    });

    return uniqueTemplates;
  };

  const reactivateLicense = ({ id }) => {
    axios
      .post(`/api/licenses/reactivate?license_id=${id}`)
      .then(({ data }) => {
        createSuccessToast('Success', data.message);
        getLicensesList();
      })
      .catch((error) => createDangerToast('Error', error));
  };

  const disableLicense = ({ id }) => {
    axios
      .post(`/api/licenses/disable?license_id=${id}`)
      .then(({ data }) => {
        createSuccessToast('Success', data.message);
        getLicensesList();
      })
      .catch((error) => createDangerToast('Error', error));
  };

  const showLicenseDetails = (license) => {
    setLicenseDetails(license);
    setIsDetailsModalVisible(true);
  };

  const closeLicenseDetails = () => {
    setLicenseDetails({});
    setIsDetailsModalVisible(false);
  };

  const showDateModal = (license) => {
    setLicenseToExtend(license);
    setNewExpirationDate(moment(license.expirationDate, 'YYYY-MM-DD HH:mm'));
    setIsDateModalVisible(true);
  };

  const closeDateModal = () => {
    setIsDateModalVisible(false);
    setLicenseToExtend({});
    setNewExpirationDate({});
  };

  const extendLicenseExpirationDate = () => {
    const { id } = licenseToExtend;
    axios
      .put(
        `/api/licenses/expiration_date?license_id=${id}`,
        newExpirationDate.format('YYYY-MM-DD HH:mm')
      )
      .then(({ data }) => {
        createSuccessToast('Success', data.message);
        closeDateModal();
        getLicensesList();
      })
      .catch((error) => createDangerToast('Error', error));
  };

  const actions = [
    {
      name: 'Reactivate license',
      description: 'Reactivate this license',
      icon: 'play',
      type: 'icon',
      isPrimary: true,
      onClick: reactivateLicense,
      available: ({ isActive }) => !isActive,
    },
    {
      name: 'Disable license',
      description: 'Disable this license',
      icon: 'stop',
      type: 'icon',
      isPrimary: true,
      onClick: disableLicense,
      available: ({ isActive }) => isActive,
    },
    {
      name: `Manage license`,
      description: 'Manage license',
      icon: 'document',
      type: 'icon',
      isPrimary: true,
      onClick: showLicenseDetails,
    },
    {
      name: 'Extend expiration date',
      description: 'Extend license expiration date',
      icon: 'calendar',
      type: 'icon',
      onClick: showDateModal,
    },
  ];

  const columns = [
    {
      field: 'name',
      name: 'License',
      sortable: true,
      footer: ({ items }) =>
        `${items.length} ${items.length === 1 ? 'license' : 'licenses'}`,
    },
    {
      field: 'generationDate',
      name: 'Generation Date',
      sortable: true,
    },
    {
      field: 'expirationDate',
      name: 'Expiration Date',
      sortable: true,
    },
    {
      field: 'customer.name',
      name: 'Customer',
      sortable: true,
    },
    {
      field: 'isExpired',
      name: 'Expired',
      render: (isExpired) => (
        <EuiBadge
          color={isExpired ? 'danger' : 'secondary'}
          style={{ width: '75px', textAlign: 'center' }}
        >
          {isExpired ? 'EXPIRED' : 'VALID'}
        </EuiBadge>
      ),
    },
    {
      field: 'isActive',
      name: 'Active',
      render: (isActive) => (
        <EuiHealth color={isActive ? 'success' : 'danger'} />
      ),
    },
    {
      field: 'Actions',
      actions,
    },
  ];

  const renderToolsRight = () => (
    <EuiButton
      color="secondary"
      iconType="refresh"
      iconSide="right"
      onClick={getLicensesList}
    >
      Refresh
    </EuiButton>
  );

  const expirationDateModal = isDateModalVisible ? (
    <ConfirmModal
      title={`Extend expiration date of license ${licenseToExtend.name}`}
      content={
        <LicenseExpirationForm
          expirationDate={newExpirationDate}
          setExpirationDate={setNewExpirationDate}
        />
      }
      closeModal={closeDateModal}
      confirmModal={extendLicenseExpirationDate}
    />
  ) : null;

  const licenseDetailsModal = isDetailsModalVisible ? (
    <DetailsModal
      title={`License ${licenseDetails?.name} for ${licenseDetails?.customer?.name}`}
      content={<LicenseDetailsForm licenseDetails={licenseDetails} />}
      closeModal={closeLicenseDetails}
    />
  ) : null;

  return (
    <Fragment>
      {licenseDetailsModal}
      {expirationDateModal}
      <EuiInMemoryTable
        itemId="id"
        items={licensesList}
        noItemsMessage="No licenses found"
        columns={columns}
        loading={isLoading}
        pagination
        search={{
          toolsRight: renderToolsRight(),
          box: {
            incremental: true,
          },
          filters: [
            {
              type: 'field_value_toggle_group',
              field: 'isActive',
              items: [
                {
                  value: true,
                  name: 'Active',
                },
                {
                  value: false,
                  name: 'Inactive',
                },
              ],
            },
            {
              type: 'field_value_toggle_group',
              field: 'isExpired',
              items: [
                {
                  value: false,
                  name: 'Valid',
                },
                {
                  value: true,
                  name: 'Expired',
                },
              ],
            },
            {
              type: 'field_value_selection',
              field: 'customer.name',
              name: 'Customer(s)',
              filterWith: 'includes',
              operator: 'exact',
              multiSelect: 'or',
              options: licenseCustomersList,
              noOptionsMessage: 'No license customers available',
            },
            {
              type: 'field_value_selection',
              field: 'usedTemplate.name',
              name: 'Template(s)',
              filterWith: 'includes',
              operator: 'exact',
              multiSelect: 'or',
              options: licenseTemplatesList,
              noOptionsMessage: 'No license templates available',
            },
          ],
        }}
        sorting
      />
    </Fragment>
  );
}

export default LicensesManagementTab;

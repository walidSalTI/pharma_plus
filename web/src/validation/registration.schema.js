const validate = (data) => {
  const errors = {};
  const isCompany = data.role === 'company';

  if (isCompany) {
    if (!data.companyName?.trim()) {
      errors.companyName = 'Company name is required.';
    }
    if (!data.regNumber?.trim()) {
      errors.regNumber = 'Registration number is required.';
    }
    if (!data.commercialReg) {
      errors.commercialReg = 'Please upload your commercial register.';
    }
  } else {
    if (!data.fullName?.trim()) {
      errors.fullName = 'Full name is required.';
    }
    if (!data.license?.trim()) {
      errors.license = 'License number is required.';
    }
    if (!data.syndicateCard) {
      errors.syndicateCard = 'Please upload your syndicate card.';
    }
  }

  if (!data.email?.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!/^[\d\s\-+()]{7,}$/.test(data.phone)) {
    errors.phone = 'Enter a valid phone number.';
  }
  return errors;
};

export default validate;

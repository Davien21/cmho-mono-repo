// update employee modal
import { useEffect, useState } from 'react';
import { useForm, Controller, useFormContext, FormProvider } from 'react-hook-form';
import { ArrowLeft, Building } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ResponsiveDialog';
import { useModalContext } from '@/contexts/modal-context';
import { IBank } from '@/types';
import { SearchableSelect } from '@/components/SearchableSelect';
import { useGetBanksQuery } from '@/store/bank-slice';
import { useUpdateEmployeeMutation } from '@/store/employees-slice';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { cn, getYupCurrencyValidator } from '@/lib/utils';
import { MoneyInput } from '../MoneyInput';

interface IFormValues {
  name: string;
  position: string;
  salary: number;
  bank_id: number;
  account_number: string;
}

const validationSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  position: yup.string().required('Position is required'),
  salary: getYupCurrencyValidator('Salary'),
  bank_id: yup.number().required('Bank is required'),
  account_number: yup.string().required('Account number is required'),
});

export const UpdateEmployeeModal = () => {
  const { modals, closeModal } = useModalContext();
  const modal = modals['update-employee'] || { isOpen: false };

  const [currentStep, setCurrentStep] = useState(1);

  const formMethods = useForm<IFormValues>({
    mode: 'onChange',
    resolver: yupResolver(validationSchema),
  });

  // 🔁 Update form values via reset only when modal opens with data
  useEffect(() => {
    if (!modal.isOpen || !modal.data) return;

    formMethods.reset({
      name: modal.data.name,
      position: modal.data.position,
      salary: modal.data.salary,
      bank_id: modal.data.bank?.bank_id,
      account_number: modal.data.bank?.account_number,
    });
  }, [modal.isOpen, modal.data, formMethods.reset]);

  const handleClose = () => {
    closeModal('update-employee');
    formMethods.reset();
    setCurrentStep(1);
  };

  return (
    <ResponsiveDialog.Root
      key={modal.data?._id || 'update-employee'}
      open={modal.isOpen}
      onOpenChange={handleClose}
    >
      <ResponsiveDialog.Portal>
        <ResponsiveDialog.Overlay />
        <ResponsiveDialog.Content>
          <ResponsiveDialog.Header>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(1)}
                className={cn(
                  'p-2 bg-gray-100 rounded-full transition-colors',
                  currentStep === 1 && 'cursor-not-allowed opacity-50',
                  currentStep === 2 && 'hover:bg-gray-200'
                )}
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <ResponsiveDialog.Title className="text-xl font-bold">
                {currentStep === 1 ? 'Add Employee Details' : 'Bank Account Details'}
              </ResponsiveDialog.Title>
            </div>
            <p className="text-sm text-gray-500">Step {currentStep} of 2</p>
          </ResponsiveDialog.Header>

          <FormProvider {...formMethods}>
            <div className="relative w-full overflow-hidden h-full">
              <div
                className={`flex transition-transform duration-300 ease-in-out w-[200%]`}
                style={{ transform: `translateX(-${(currentStep - 1) * 50}%)` }}
              >
                <div className="w-full flex">
                  <Step1Form onNext={() => setCurrentStep(2)} onClose={handleClose} />
                </div>
                <div className="w-full flex">
                  <Step2Form onClose={handleClose} />
                </div>
              </div>
            </div>
          </FormProvider>
        </ResponsiveDialog.Content>
      </ResponsiveDialog.Portal>
    </ResponsiveDialog.Root>
  );
};

const Step1Form = ({ onNext, onClose }: { onNext: () => void; onClose: () => void }) => {
  const {
    control,
    register,
    formState: { errors },
    trigger,
  } = useFormContext<IFormValues>();

  const onSubmit = async () => {
    const isValid = await trigger(['name', 'position', 'salary']);
    if (isValid) onNext();
  };

  return (
    <form className="space-y-4 w-full p-2 mt-auto">
      <Input
        label="Full Name"
        {...register('name')}
        placeholder={`Enter employee's full name`}
        formError={errors.name?.message}
      />
      <Input
        label="Position"
        {...register('position')}
        placeholder={`Enter employee's position`}
        formError={errors.position?.message}
      />
      <Controller
        name="salary"
        control={control}
        render={({ field }) => (
          <MoneyInput
            label="Monthly Salary (₦)"
            value={field.value}
            onChange={field.onChange}
            placeholder={`Enter employee's salary`}
            formError={errors.salary?.message}
          />
        )}
      />
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="button" className="flex-1" onClick={onSubmit}>
          Continue
        </Button>
      </div>
    </form>
  );
};

const Step2Form = ({ onClose }: { onClose: () => void }) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext<IFormValues>();

  const { modals } = useModalContext();
  const modal = modals['update-employee'] || { isOpen: false };

  const [updateEmployee, { isLoading: isAdding }] = useUpdateEmployeeMutation();

  const loading = isAdding;

  const { data: banksResponse } = useGetBanksQuery();
  const banks = banksResponse?.data || [];

  const onSubmit = async (data: IFormValues) => {
    const id = modal.data?._id;
    if (!id) return;

    const { name, position, salary, bank_id, account_number } = data;
    const selectedBank = banks.find((b) => b.id === bank_id) as IBank;

    try {
      const bank = {
        bank_code: selectedBank.code,
        bank_name: selectedBank.name,
        account_number,
      };

      await updateEmployee({ name, position, salary, id, bank }).unwrap();
      toast.success('Employee updated successfully');
      onClose();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error.data as { message?: string };
        if (errorData?.message) toast.error(errorData.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full p-2 mt-auto">
      <div className="text-center mb-4">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
          <Building className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-sm text-gray-600">Add bank details for salary payments</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
        <Controller
          name="bank_id"
          control={control}
          render={({ field }) => {
            return (
              <SearchableSelect
                options={banks.map((b) => ({ label: b.name, value: b.id }))}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Select a bank"
                searchPlaceholder="Search banks..."
                emptyText="No banks found."
                formError={errors.bank_id?.message}
              />
            );
          }}
        />
      </div>

      <Input
        label="Account Number"
        {...register('account_number')}
        placeholder={`Enter employee's account number`}
        formError={errors.account_number?.message}
      />

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" isLoading={loading}>
          Update
        </Button>
      </div>
    </form>
  );
};

"use client";

import type { ComponentProps, ReactNode } from "react";
import { Controller, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type BaseProps<T extends FieldValues, TOut extends FieldValues> = {
  form: UseFormReturn<T, unknown, TOut>;
  name: Path<T>;
  label: string;
  description?: ReactNode;
  optional?: boolean;
};

function useFieldError<T extends FieldValues, TOut extends FieldValues>(form: UseFormReturn<T, unknown, TOut>, name: Path<T>) {
  return form.getFieldState(name, form.formState).error?.message;
}

function LabelText({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <>
      {label}
      {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
    </>
  );
}

export function TextField<T extends FieldValues, TOut extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  multiline,
  onValueChange,
  ...inputProps
}: BaseProps<T, TOut> & {
  multiline?: boolean;
  onValueChange?: (value: string) => void;
} & Omit<ComponentProps<"input">, "name" | "form">) {
  const error = useFieldError(form, name);
  const id = `field-${String(name)}`;
  const { onChange, ...registered } = form.register(name);
  const handleChange = (event: { target: { value: string } }) => {
    void onChange(event);
    onValueChange?.(event.target.value);
  };

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>
        <LabelText label={label} optional={optional} />
      </FieldLabel>
      {multiline ? (
        <Textarea
          id={id}
          aria-invalid={Boolean(error)}
          placeholder={inputProps.placeholder}
          className="min-h-24"
          {...registered}
          onChange={handleChange}
        />
      ) : (
        <Input id={id} aria-invalid={Boolean(error)} {...inputProps} {...registered} onChange={handleChange} />
      )}
      {description && !error && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function SwitchField<T extends FieldValues, TOut extends FieldValues>({
  form,
  name,
  label,
  description,
}: BaseProps<T, TOut>) {
  const id = `field-${String(name)}`;
  return (
    <Field orientation="horizontal" className="items-start justify-between gap-6">
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <Switch id={id} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
        )}
      />
    </Field>
  );
}

export function SelectField<T extends FieldValues, TOut extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  options,
  placeholder = "Select…",
}: BaseProps<T, TOut> & {
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const error = useFieldError(form, name);
  const id = `field-${String(name)}`;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>
        <LabelText label={label} optional={optional} />
      </FieldLabel>
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <Select value={field.value ? String(field.value) : undefined} onValueChange={field.onChange}>
            <SelectTrigger id={id} aria-invalid={Boolean(error)} className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {description && !error && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

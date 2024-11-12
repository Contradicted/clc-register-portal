"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form"
import { CalendarIcon, LoaderCircle } from "lucide-react";
import { format } from "date-fns";

import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { 
    Select, 
    SelectContent, 
    SelectGroup, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";
import { EditUserDetailsSchema } from "@/schemas";
import { FormError } from "@/components/FormError";
import { update } from "@/actions/update";
import { toast } from "@/components/ui/use-toast";

export const UserDetailsEditForm = ({ userDetails }) => {

    const [formErrors, setFormErrors] = useState();
    const [error, setError] = useState();
    const [isPending, startTransition] = useTransition();

    const router = useRouter();

    const form = useForm({
        defaultValues: {
            userID: userDetails.id,
            username: userDetails.email,
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
            gender: userDetails.gender || undefined,
            dateOfBirth: userDetails.dateOfBirth || undefined,
            addressLine1: userDetails.addressLine1 || undefined,
            addressLine2: userDetails.addressLine2 || undefined,
            city: userDetails.city || undefined,
            postcode: userDetails.postcode || undefined,
            homeTelephoneNo: userDetails.homeTelephoneNo || undefined
        }
    })

    const now = new Date();

    const genderPlaceholder = form.watch("gender") || "Select an option";

    const onSubmit = (values) => {
      setFormErrors("")
      setError("")

     console.log(values)
     const isValid = EditUserDetailsSchema.safeParse(values);

     if (!isValid.success) {
      setFormErrors(isValid.error.formErrors.fieldErrors);
       return;
     }

     startTransition(() => {
      update(values)
        .then((data) => {
          if (data?.error) {
            setError(data.error)
          }

          if (data?.success) {
            toast({
              variant: "success",
              title: data.success,
            });

            router.push("/user-details")
          }
        })
     })
    };

    return (
      <Form {...form}>
        <FormError message={formErrors || error} className="mb-5" />
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="border-[1.5px] border-[#F5F5F5] rounded-[10px] p-5 flex">
            <div className="gap-4 md:w-[400px] space-y-4">
              <div className="grid gap-4 md:w-[250px]">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="userID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            {...form.register("userID")}
                            disabled
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            {...form.register("username")}
                            disabled
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="grid gap-4 lg:w-[615px]">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            {...form.register("firstName")}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            {...form.register("lastName")}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="grid gap-4 w-[250px]">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[250px] justify-start text-left font-normal h-12 rounded-[10px] px-[25px]",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={isPending}
                              >
                                {field.value ? (
                                  format(field.value, "dd-MM-yyyy")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              captionLayout="dropdown-buttons"
                              fromYear={1920}
                              toYear={now.getFullYear()}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                              weekStartsOn={1}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={isPending}
                          >
                            <SelectTrigger className="w-[250px]">
                              <SelectValue placeholder={genderPlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Non-binary">
                                  Non-binary
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="grid gap-4 lg:w-[615px]">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            {...form.register("addressLine1")}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            {...form.register("addressLine2")}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="grid gap-4 w-[250px]">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            {...form.register("city")}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            {...form.register("postcode")}
                            disabled={isPending}
                            type="text"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="homeTelephoneNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Telephone No.</FormLabel>
                        <FormControl className="w-full">
                          <PhoneInput {...field} disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-center gap-4 my-9">
            <Button asChild>
              <Link href="/user-details">Cancel</Link>
            </Button>
            <Button type="submit">
              {isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <p>Save changes</p>
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
}
<script lang="ts">
	import { defaults, fileProxy, superForm, superValidate } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { loginSchema } from './schema';
	import { toast } from 'svelte-sonner';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';

	const form = superForm(defaults(zod4(loginSchema)), {
		validators: zod4Client(loginSchema),
		async onSubmit({ formData }) {
			const form = await superValidate(formData, zod4(loginSchema));
			if (!form.valid) return toast.error('Please fix the errors in the form');

			await authClient.signIn.email(form.data, {
				onSuccess() {
					toast.success('Login successful!');
					goto('/');
				},
				onError(ctx) {
					toast.error(`Login failed: ${ctx.error.message}`);
				}
			});
		}
	});

	const { form: formData, enhance, submit } = form;
</script>

<div
	class="flex h-screen items-center justify-center px-4"
	style="background: linear-gradient(to right bottom, rgb(12, 74, 110), rgb(129, 140, 248), rgb(76, 29, 149))"
>
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header class="text-center">
			<Card.Title class="text-2xl">Login</Card.Title>
			<Card.Description>Enter your credentials to access your account</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance onsubmit={submit} class="space-y-6">
				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Email</Form.Label>
							<Input {...props} type="email" bind:value={$formData.email} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="password">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Password</Form.Label>
							<Input {...props} type="password" bind:value={$formData.password} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button class="w-full">Login</Form.Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>

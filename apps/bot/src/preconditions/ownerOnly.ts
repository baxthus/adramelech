import { ExpectedError } from '~/types/errors';
import { Precondition } from '~/types/precondition';

export default Precondition.from(async (intr) => {
  const application = await intr.client.application.fetch();
  const owner = await intr.client.users.fetch(application.owner!.id);
  if (intr.user.id !== owner.id)
    throw new ExpectedError(
      'You must be the owner of the bot to use this command',
    );
});

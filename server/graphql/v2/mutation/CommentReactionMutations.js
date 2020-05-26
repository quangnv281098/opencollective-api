import { GraphQLNonNull, GraphQLString } from 'graphql';

import { mustBeLoggedInTo } from '../../../lib/auth';
import models from '../../../models';
import { NotFound, Unauthorized } from '../../errors';
import { CommentReactionCreateInput } from '../input/CommentReactionCreateInput';
import { CommentReaction } from '../object/CommentReaction';

async function createCommentReaction(entity, args, req) {
  if (!req.remoteUser) {
    throw new Unauthorized();
  }

  const { emoji, comment } = args;

  return await models.CommentReaction.addReaction(req.remoteUser, comment, emoji);
}

async function deleteCommentReaction(id, remoteUser) {
  mustBeLoggedInTo(remoteUser, 'remove this comment reaction');
  const commentReaction = await models.CommentReaction.findByPk(id);
  if (!commentReaction) {
    throw new NotFound(`This comment reaction does not exist or has been deleted.`);
  }
  // Check permissions
  if (remoteUser.id !== commentReaction.UserId) {
    throw new Unauthorized('You need to be the owner of this comment reaction to be able to delete it');
  }

  return commentReaction.removeReaction(id);
}

const commentReactionMutations = {
  addCommentReaction: {
    type: CommentReaction,
    args: {
      commentReaction: {
        type: new GraphQLNonNull(CommentReactionCreateInput),
      },
    },
    resolve: async (entity, args, req) => {
      return createCommentReaction(entity, args, req);
    },
  },

  removeCommentReaction: {
    type: CommentReaction,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLString),
      },
    },
    resolve(_, { id }, { remoteUser }) {
      return deleteCommentReaction(id, remoteUser);
    },
  },
};

export default commentReactionMutations;

from flask import Blueprint, request, jsonify
from app import db
from app.models.recipe import Recipe
from app.auth_helper import require_auth

recipes_bp = Blueprint('recipes', __name__)


@recipes_bp.route('', methods=['GET'])
@require_auth
def list_recipes(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)
    q = Recipe.query.filter_by(email=current_user['email'])
    total = q.count()
    recipes = q.order_by(Recipe.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'recipes': [r.to_dict() for r in recipes], 'total': total, 'page': page, 'per_page': per_page})


@recipes_bp.route('', methods=['POST'])
@require_auth
def create_recipe(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400
    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'errors': {'title': 'Title is required.'}}), 422
    recipe = Recipe(
        email=current_user['email'],
        title=title,
        category=data.get('category', ''),
        diet_type=data.get('diet_type', 'balanced'),
        servings=int(data.get('servings', 2)),
        calories=float(data.get('calories', 0)),
        protein=float(data.get('protein', 0)),
        carbs=float(data.get('carbs', 0)),
        fat=float(data.get('fat', 0)),
        sugar=float(data.get('sugar', 0)),
        sodium=float(data.get('sodium', 0)),
        fiber=float(data.get('fiber', 0)),
        description=data.get('description', ''),
    )
    db.session.add(recipe)
    db.session.commit()
    return jsonify({'recipe': recipe.to_dict()}), 201


@recipes_bp.route('/<int:recipe_id>', methods=['DELETE'])
@require_auth
def delete_recipe(current_user, recipe_id):
    recipe = Recipe.query.filter_by(id=recipe_id, email=current_user['email']).first()
    if not recipe:
        return jsonify({'error': 'Recipe not found.'}), 404
    db.session.delete(recipe)
    db.session.commit()
    return jsonify({'message': 'Recipe deleted.'})
